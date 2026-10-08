package com.redsocial.posts;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/** Acceso a Neo4j para (:Post) y [:REACCIONA]. Todo el Cypher de posts vive aqui. */
@ApplicationScoped
public class PostRepository {

    public static final int POR_PAGINA = 20;

    @Inject
    Driver driver;

    /** Crea el post y la relacion PUBLICA. Vacio si el autor no existe. */
    public Optional<Post> crear(String autorId, String texto, String mediaKey) {
        // Map.of no admite null y mediaKey es opcional: se usa HashMap.
        Map<String, Object> params = new HashMap<>();
        params.put("autor", autorId);
        params.put("id", UUID.randomUUID().toString());
        params.put("texto", texto);
        params.put("mediaKey", mediaKey);
        try (Session session = driver.session()) {
            return session.executeWrite(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $autor})
                        CREATE (p:Post {id: $id, texto: $texto, mediaKey: $mediaKey, fecha: datetime()})
                        CREATE (u)-[:PUBLICA]->(p)
                        RETURN p.id AS id, p.texto AS texto, p.mediaKey AS mediaKey,
                               toString(p.fecha) AS fecha, u.id AS autorId, u.nombre AS autorNombre,
                               0 AS reacciones, false AS yaReaccione
                        """, params);
                if (!res.hasNext()) {
                    return Optional.<Post>empty();
                }
                return Optional.of(aPost(res.next()));
            });
        }
    }

    public Optional<Post> buscarPorId(String postId, String yo) {
        try (Session session = driver.session()) {
            return session.executeRead(tx -> {
                var res = tx.run("""
                        MATCH (autor:Usuario)-[:PUBLICA]->(p:Post {id: $post})
                        OPTIONAL MATCH (:Usuario)-[r:REACCIONA]->(p)
                        WITH p, autor, count(r) AS reacciones
                        OPTIONAL MATCH (:Usuario {id: $yo})-[mia:REACCIONA]->(p)
                        RETURN p.id AS id, p.texto AS texto, p.mediaKey AS mediaKey,
                               toString(p.fecha) AS fecha, autor.id AS autorId, autor.nombre AS autorNombre,
                               reacciones, mia IS NOT NULL AS yaReaccione
                        """, Map.of("post", postId, "yo", yo));
                if (!res.hasNext()) {
                    return Optional.<Post>empty();
                }
                return Optional.of(aPost(res.next()));
            });
        }
    }

    /** Feed: recorre SIGUE y luego PUBLICA, asi solo aparecen posts de a quienes sigo. */
    public List<Post> feed(String yo, int pagina) {
        try (Session session = driver.session()) {
            return session.executeRead(tx -> tx.run("""
                    MATCH (:Usuario {id: $yo})-[:SIGUE]->(autor:Usuario)-[:PUBLICA]->(p:Post)
                    OPTIONAL MATCH (:Usuario)-[r:REACCIONA]->(p)
                    WITH p, autor, count(r) AS reacciones
                    OPTIONAL MATCH (:Usuario {id: $yo})-[mia:REACCIONA]->(p)
                    RETURN p.id AS id, p.texto AS texto, p.mediaKey AS mediaKey,
                           toString(p.fecha) AS fecha, autor.id AS autorId, autor.nombre AS autorNombre,
                           reacciones, mia IS NOT NULL AS yaReaccione
                    ORDER BY p.fecha DESC, p.id
                    SKIP $saltar LIMIT $limite
                    """,
                    Map.of("yo", yo, "saltar", (long) pagina * POR_PAGINA, "limite", (long) POR_PAGINA))
                    .list(PostRepository::aPost));
        }
    }

    /** Publicaciones de un autor; "yo" solo se usa para saber si ya reaccione a cada una. */
    public List<Post> deAutor(String autorId, String yo, int pagina) {
        try (Session session = driver.session()) {
            return session.executeRead(tx -> tx.run("""
                    MATCH (autor:Usuario {id: $autor})-[:PUBLICA]->(p:Post)
                    OPTIONAL MATCH (:Usuario)-[r:REACCIONA]->(p)
                    WITH p, autor, count(r) AS reacciones
                    OPTIONAL MATCH (:Usuario {id: $yo})-[mia:REACCIONA]->(p)
                    RETURN p.id AS id, p.texto AS texto, p.mediaKey AS mediaKey,
                           toString(p.fecha) AS fecha, autor.id AS autorId, autor.nombre AS autorNombre,
                           reacciones, mia IS NOT NULL AS yaReaccione
                    ORDER BY p.fecha DESC, p.id
                    SKIP $saltar LIMIT $limite
                    """,
                    Map.of("autor", autorId, "yo", yo,
                            "saltar", (long) pagina * POR_PAGINA, "limite", (long) POR_PAGINA))
                    .list(PostRepository::aPost));
        }
    }

    /** Crea o cambia mi reaccion. Devuelve el total de reacciones, o vacio si el post no existe. */
    public Optional<Long> reaccionar(String yo, String postId, String tipo) {
        try (Session session = driver.session()) {
            return session.executeWrite(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $yo}), (p:Post {id: $post})
                        MERGE (u)-[r:REACCIONA]->(p)
                        ON CREATE SET r.tipo = $tipo, r.fecha = datetime()
                        ON MATCH SET r.tipo = $tipo
                        RETURN COUNT { (:Usuario)-[:REACCIONA]->(p) } AS total
                        """, Map.of("yo", yo, "post", postId, "tipo", tipo));
                if (!res.hasNext()) {
                    return Optional.<Long>empty();
                }
                return Optional.of(res.next().get("total").asLong());
            });
        }
    }

    public void quitarReaccion(String yo, String postId) {
        try (Session session = driver.session()) {
            session.executeWrite(tx -> {
                tx.run("""
                        MATCH (:Usuario {id: $yo})-[r:REACCIONA]->(:Post {id: $post})
                        DELETE r
                        """, Map.of("yo", yo, "post", postId)).consume();
                return null;
            });
        }
    }

    private static Post aPost(org.neo4j.driver.Record r) {
        return new Post(
                r.get("id").asString(),
                r.get("texto").asString(),
                r.get("mediaKey").asString(null),
                r.get("fecha").asString(),
                r.get("autorId").asString(),
                r.get("autorNombre").asString(),
                r.get("reacciones").asLong(),
                r.get("yaReaccione").asBoolean());
    }
}