package com.redsocial.usuarios;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/** Acceso a Neo4j para nodos (:Usuario). Todo el Cypher de usuarios vive aquí. */
@ApplicationScoped
public class UsuarioRepository {

    @Inject
    Driver driver;

    public Usuario crear(String nombre, String email, String passwordHash) {
        String id = UUID.randomUUID().toString();
        try (Session session = driver.session()) {
            return session.executeWrite(tx -> {
                var res = tx.run("""
                        CREATE (u:Usuario {
                            id: $id, nombre: $nombre, email: $email,
                            passwordHash: $hash, bio: '', creadoEn: datetime()
                        })
                        RETURN u.id AS id, u.nombre AS nombre, u.email AS email, u.bio AS bio
                        """,
                        Map.of("id", id, "nombre", nombre, "email", email, "hash", passwordHash));
                return aUsuario(res.single());
            });
        }
    }

    public Optional<UsuarioCredenciales> buscarCredencialesPorEmail(String email) {
        try (Session session = driver.session()) {
            return session.executeRead(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {email: $email})
                        RETURN u.id AS id, u.nombre AS nombre, u.email AS email,
                               u.bio AS bio, u.passwordHash AS hash
                        """, Map.of("email", email));
                if (!res.hasNext()) {
                    return Optional.<UsuarioCredenciales>empty();
                }
                var r = res.next();
                return Optional.of(new UsuarioCredenciales(aUsuario(r), r.get("hash").asString()));
            });
        }
    }

    public Optional<Usuario> buscarPorId(String id) {
        try (Session session = driver.session()) {
            return session.executeRead(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $id})
                        RETURN u.id AS id, u.nombre AS nombre, u.email AS email, u.bio AS bio
                        """, Map.of("id", id));
                if (!res.hasNext()) {
                    return Optional.<Usuario>empty();
                }
                return Optional.of(aUsuario(res.next()));
            });
        }
    }

    public Optional<Usuario> actualizarPerfil(String id, String nombre, String bio) {
        try (Session session = driver.session()) {
            return session.executeWrite(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $id})
                        SET u.nombre = $nombre, u.bio = $bio
                        RETURN u.id AS id, u.nombre AS nombre, u.email AS email, u.bio AS bio
                        """, Map.of("id", id, "nombre", nombre, "bio", bio == null ? "" : bio));
                if (!res.hasNext()) {
                    return Optional.<Usuario>empty();
                }
                return Optional.of(aUsuario(res.next()));
            });
        }
    }

    private static Usuario aUsuario(org.neo4j.driver.Record r) {
        return new Usuario(
                r.get("id").asString(),
                r.get("nombre").asString(),
                r.get("email").asString(),
                r.get("bio").asString(""));
    }
}
