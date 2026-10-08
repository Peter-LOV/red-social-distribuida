package com.redsocial.chat;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ChatRepository {

    @Inject
    Driver driver;

    /**
     * Obtiene o crea la conversación entre dos personas.
     * Si ya existe una conversación que los une, la reutiliza (MERGE).
     * Devuelve vacío si alguno de los dos usuarios no existe.
     */
    public Optional<String> obtenerOCrearConversacion(String yo, String otro) {
        String nuevoId = UUID.randomUUID().toString();
        try (Session s = driver.session()) {
            return s.executeWrite(tx -> {
                var res = tx.run("""
                        MATCH (a:Usuario {id: $yo}), (b:Usuario {id: $otro})
                        WHERE a <> b
                        MERGE (a)-[:PARTICIPA_EN]->(c:Conversacion)<-[:PARTICIPA_EN]-(b)
                        ON CREATE SET c.id = $nuevoId, c.creadaEn = datetime()
                        RETURN c.id AS id
                        """, Map.of("yo", yo, "otro", otro, "nuevoId", nuevoId));
                if (!res.hasNext()) {
                    return Optional.<String>empty();
                }
                return Optional.of(res.next().get("id").asString());
            });
        }
    }

    /**
     * Guarda un mensaje y devuelve a quién va dirigido.
     * Devuelve vacío si la conversación no existe o el usuario no participa en ella.
     */
    public Optional<MensajeGuardado> guardarMensaje(String yo, String convId, String texto) {
        String mensajeId = UUID.randomUUID().toString();
        try (Session s = driver.session()) {
            return s.executeWrite(tx -> {
                var res = tx.run("""
                        MATCH (u:Usuario {id: $yo})-[:PARTICIPA_EN]->(c:Conversacion {id: $conv})
                        CREATE (m:Mensaje {id: $id, texto: $texto, fecha: datetime()})
                        CREATE (c)-[:CONTIENE]->(m)
                        CREATE (u)-[:ENVIO]->(m)
                        WITH c, m, u
                        MATCH (otro:Usuario)-[:PARTICIPA_EN]->(c)
                        WHERE otro.id <> u.id
                        RETURN m.id AS id, toString(m.fecha) AS fecha, otro.id AS destinatarioId
                        """, Map.of("yo", yo, "conv", convId, "id", mensajeId, "texto", texto));
                if (!res.hasNext()) {
                    return Optional.<MensajeGuardado>empty();
                }
                var record = res.next();
                return Optional.of(new MensajeGuardado(
                        record.get("id").asString(),
                        record.get("fecha").asString(),
                        record.get("destinatarioId").asString()
                ));
            });
        }
    }

    /**
     * Consulta el historial de mensajes de una conversación.
     */
    public List<MensajeDetalle> obtenerHistorial(String yo, String convId) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH (:Usuario {id: $yo})-[:PARTICIPA_EN]->(c:Conversacion {id: $conv})
                          -[:CONTIENE]->(m:Mensaje)<-[:ENVIO]-(autor:Usuario)
                    RETURN m.id AS id, m.texto AS texto, toString(m.fecha) AS fecha, autor.id AS autorId
                    ORDER BY m.fecha ASC
                    """, Map.of("yo", yo, "conv", convId))
                    .list(r -> new MensajeDetalle(
                            r.get("id").asString(),
                            r.get("texto").asString(),
                            r.get("fecha").asString(),
                            r.get("autorId").asString()
                    )));
        }
    }

    /**
     * Lista mis conversaciones con el último mensaje enviado (la más reciente primero).
     */
    public List<ConversacionResumen> misConversaciones(String yo) {
        try (Session s = driver.session()) {
            return s.executeRead(tx -> tx.run("""
                    MATCH (:Usuario {id: $yo})-[:PARTICIPA_EN]->(c:Conversacion)<-[:PARTICIPA_EN]-(otro:Usuario)
                    OPTIONAL MATCH (c)-[:CONTIENE]->(m:Mensaje)
                    WITH c, otro, m ORDER BY m.fecha DESC, m.id DESC
                    WITH c, otro, collect(m)[0] AS ultimo
                    OPTIONAL MATCH (ultimoAutor:Usuario)-[:ENVIO]->(ultimo)
                    RETURN c.id AS id, otro.id AS otroId, otro.nombre AS otroNombre,
                           ultimo.texto AS ultimoTexto, toString(ultimo.fecha) AS ultimaFecha,
                           ultimo.id AS ultimoMensajeId, ultimoAutor.id AS ultimoAutorId
                    ORDER BY coalesce(ultimo.fecha, c.creadaEn) DESC
                    """, Map.of("yo", yo))
                    .list(r -> new ConversacionResumen(
                            r.get("id").asString(),
                            r.get("otroId").asString(),
                            r.get("otroNombre").asString(),
                            r.get("ultimoTexto").asString(null),
                            r.get("ultimaFecha").asString(null),
                            r.get("ultimoMensajeId").asString(null),
                            r.get("ultimoAutorId").asString(null)
                    )));
        }
    }
}