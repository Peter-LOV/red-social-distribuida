package com.redsocial.usuarios;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Value;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/** Todo el Cypher del grafo social ((:Usuario)-[:SIGUE]->(:Usuario)) vive aquí. */
@ApplicationScoped
public class GrafoRepository {

    @Inject
    Driver driver;

    /** Crea (yo)-[:SIGUE]->(otro). MERGE evita duplicar la relación si ya existe. */
    public boolean seguir(String yo, String otro) {
        try (Session s = driver.session()) {
            return s.executeWrite(tx -> tx.run("""
                    MATCH (a:Usuario {id: $yo}), (b:Usuario {id: $otro})
                    WHERE a <> b
                    MERGE (a)-[r:SIGUE]->(b)
                    ON CREATE SET r.desde = datetime()
                    RETURN count(r) AS n
                    """, Map.of("yo", yo, "otro", otro)).single().get("n").asInt() > 0);
        }
    }

    public void dejarDeSeguir(String yo, String otro) {
        try (Session s = driver.session()) {
            s.executeWrite(tx -> tx.run("""
                    MATCH (:Usuario {id: $yo})-[r:SIGUE]->(:Usuario {id: $otro})
                    DELETE r
                    """, Map.of("yo", yo, "otro", otro)).consume());
        }
    }

    private List<UsuarioResumen> listaDeUsuarios(String cypher, Map<String, Object> params) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run(cypher, params).list(r -> new UsuarioResumen(
                    r.get("id").asString(),
                    r.get("nombre").asString(),
                    r.get("bio").asString(""))));
        }
    }

    /** Nivel 1: quienes siguen a {id}. */
    public List<UsuarioResumen> seguidores(String id) {
        return listaDeUsuarios("""
                MATCH (u:Usuario)-[:SIGUE]->(:Usuario {id: $id})
                RETURN u.id AS id, u.nombre AS nombre, u.bio AS bio
                ORDER BY u.nombre
                """, Map.of("id", id));
    }

    /** Nivel 1: a quienes sigue {id}. */
    public List<UsuarioResumen> seguidos(String id) {
        return listaDeUsuarios("""
                MATCH (:Usuario {id: $id})-[:SIGUE]->(u:Usuario)
                RETURN u.id AS id, u.nombre AS nombre, u.bio AS bio
                ORDER BY u.nombre
                """, Map.of("id", id));
    }

    /** Patrón en V: usuarios a los que sigo yo y también sigue otro usuario. */
    public List<UsuarioResumen> enComun(String yo, String otro) {
        return listaDeUsuarios("""
                MATCH (a:Usuario {id: $yo})-[:SIGUE]->(comun:Usuario)<-[:SIGUE]-(b:Usuario {id: $otro})
                RETURN comun.id AS id, comun.nombre AS nombre, comun.bio AS bio
                ORDER BY comun.nombre
                """, Map.of("yo", yo, "otro", otro));
    }

    /**
     * Sugerencias (2 niveles): yo -> amigo -> C, y yo no sigo a C.
     * Ranking: más seguidos míos que lo siguen primero; desempate por popularidad.
     *
     * Arranque en frío: si todavía no hay nadie a 2 saltos (usuario nuevo), se sugieren los
     * usuarios con más seguidores a los que aún no sigo. Sigue siendo información del grafo
     * (grado de entrada de SIGUE), nunca un orden aleatorio.
     */
    public List<Sugerencia> sugerencias(String yo) {
        List<Sugerencia> porRed = sugerenciasPorRed(yo);
        return porRed.isEmpty() ? sugerenciasPorPopularidad(yo) : porRed;
    }

    private List<Sugerencia> sugerenciasPorPopularidad(String yo) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH (yo:Usuario {id: $id}), (c:Usuario)
                    WHERE c <> yo AND NOT (yo)-[:SIGUE]->(c)
                    RETURN c.id AS id, c.nombre AS nombre,
                           COUNT { (c)<-[:SIGUE]-() } AS popularidad
                    ORDER BY popularidad DESC, nombre, id
                    LIMIT 10
                    """, Map.of("id", yo)).list(r -> new Sugerencia(
                    r.get("id").asString(),
                    r.get("nombre").asString(),
                    0,
                    List.of(),
                    r.get("popularidad").asLong())));
        }
    }

    private List<Sugerencia> sugerenciasPorRed(String yo) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH (yo:Usuario {id: $id})-[:SIGUE]->(amigo:Usuario)-[:SIGUE]->(c:Usuario)
                    WHERE c <> yo AND NOT (yo)-[:SIGUE]->(c)
                    WITH c, collect(DISTINCT amigo.nombre) AS mediadores
                    RETURN c.id AS id, c.nombre AS nombre,
                           size(mediadores) AS enComun,
                           mediadores[0..3] AS via,
                           COUNT { (c)<-[:SIGUE]-() } AS popularidad
                    ORDER BY enComun DESC, popularidad DESC, nombre, id
                    LIMIT 10
                    """, Map.of("id", yo)).list(r -> new Sugerencia(
                    r.get("id").asString(),
                    r.get("nombre").asString(),
                    r.get("enComun").asInt(),
                    r.get("via").asList(Value::asString),
                    r.get("popularidad").asLong())));
        }
    }

    /** Recorrido de varios niveles: usuarios alcanzables en hasta 3 saltos de SIGUE. */
    public List<Alcanzable> alcanzables(String yo) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH p = (yo:Usuario {id: $id})-[:SIGUE*1..3]->(u:Usuario)
                    WHERE u <> yo
                    WITH u, min(length(p)) AS saltos
                    RETURN u.id AS id, u.nombre AS nombre, saltos
                    ORDER BY saltos, nombre
                    LIMIT 50
                    """, Map.of("id", yo)).list(r -> new Alcanzable(
                    r.get("id").asString(),
                    r.get("nombre").asString(),
                    r.get("saltos").asInt())));
        }
    }

    /** Estado de la relación entre yo y otro usuario (para el botón Seguir del perfil). */
    public Optional<EstadoSocial> estado(String yo, String otro) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $otro})
                        RETURN EXISTS { (:Usuario {id: $yo})-[:SIGUE]->(u) } AS sigo,
                               EXISTS { (u)-[:SIGUE]->(:Usuario {id: $yo}) } AS meSigue,
                               COUNT { (u)<-[:SIGUE]-() } AS seguidores,
                               COUNT { (u)-[:SIGUE]->() } AS seguidos
                        """, Map.of("yo", yo, "otro", otro));
                if (!res.hasNext()) {
                    return Optional.<EstadoSocial>empty();
                }
                var r = res.next();
                return Optional.of(new EstadoSocial(
                        r.get("sigo").asBoolean(),
                        r.get("meSigue").asBoolean(),
                        r.get("seguidores").asLong(),
                        r.get("seguidos").asLong()));
            });
        }
    }

    /** Todo el grafo, en formato nodos/enlaces para dibujarlo en el frontend. */
    public GrafoResponse grafo() {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> {
                var nodos = new ArrayList<GrafoResponse.Nodo>();
                var enlaces = new ArrayList<GrafoResponse.Enlace>();
                tx.run("""
                        MATCH (u:Usuario)
                        OPTIONAL MATCH (u)-[:SIGUE]->(v:Usuario)
                        RETURN u.id AS id, u.nombre AS nombre, collect(v.id) AS sigue
                        """).forEachRemaining(r -> {
                    String id = r.get("id").asString();
                    nodos.add(new GrafoResponse.Nodo(id, r.get("nombre").asString()));
                    for (String destino : r.get("sigue").asList(Value::asString)) {
                        enlaces.add(new GrafoResponse.Enlace(id, destino));
                    }
                });
                return new GrafoResponse(nodos, enlaces);
            });
        }
    }
}
