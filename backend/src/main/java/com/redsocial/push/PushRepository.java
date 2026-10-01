package com.redsocial.push;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Value;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class PushRepository {

    @Inject
    Driver driver;

    public void guardarSuscripcion(String usuarioId, String endpoint, String p256dh, String auth) {
        try (Session s = driver.session()) {
            s.executeWrite(tx -> tx.run("""
                    MERGE (s:Suscripcion {endpoint: $endpoint})
                    SET s.p256dh = $p256dh, s.auth = $auth
                    WITH s
                    OPTIONAL MATCH (:Usuario)-[viejo:TIENE_SUSCRIPCION]->(s)
                    DELETE viejo
                    WITH DISTINCT s
                    MATCH (u:Usuario {id: $id})
                    MERGE (u)-[:TIENE_SUSCRIPCION]->(s)
                    """, Map.of("endpoint", endpoint, "p256dh", p256dh, "auth", auth, "id", usuarioId)).consume());
        }
    }

    public void eliminarSuscripcion(String endpoint) {
        try (Session s = driver.session()) {
            s.executeWrite(tx -> tx.run("""
                    MATCH (s:Suscripcion {endpoint: $endpoint}) DETACH DELETE s
                    """, Map.of("endpoint", endpoint)).consume());
        }
    }

    public List<SuscripcionInfo> destinatarios(String autorId) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH (seguidor:Usuario)-[:SIGUE]->(:Usuario {id: $autorId})
                    MATCH (seguidor)-[:TIENE_SUSCRIPCION]->(s:Suscripcion)
                    RETURN s.endpoint AS endpoint, s.p256dh AS p256dh, s.auth AS auth
                    """, Map.of("autorId", autorId)).list(r -> new SuscripcionInfo(
                    r.get("endpoint").asString(),
                    r.get("p256dh").asString(),
                    r.get("auth").asString())));
        }
    }

    public record SuscripcionInfo(String endpoint, String p256dh, String auth) {}
}
