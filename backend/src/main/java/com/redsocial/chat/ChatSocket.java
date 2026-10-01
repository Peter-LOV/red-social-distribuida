package com.redsocial.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.websockets.next.*;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@WebSocket(path = "/ws/chat")
public class ChatSocket {

    // userId -> conjunto de conexiones abiertas (el usuario puede tener varias pestañas)
    private static final Map<String, Set<WebSocketConnection>> EN_LINEA = new ConcurrentHashMap<>();
    // connectionId -> userId
    private static final Map<String, String> USUARIO_DE = new ConcurrentHashMap<>();

    @Inject
    JWTParser parser;

    @Inject
    ChatRepository repo;

    @Inject
    ObjectMapper json;

    @OnOpen
    public Uni<Void> alAbrir(WebSocketConnection conexion, HandshakeRequest peticion) {
        try {
            String token = valorDeQuery(peticion.query(), "token");
            if (token == null || token.isBlank()) {
                return conexion.close();
            }
            // Valida firma RSA y expiración del JWT
            String userId = parser.parse(token).getSubject();
            USUARIO_DE.put(conexion.id(), userId);
            EN_LINEA.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(conexion);
            return Uni.createFrom().voidItem();
        } catch (Exception e) {
            return conexion.close(); // Token inválido o expirado
        }
    }

    @OnClose
    public void alCerrar(WebSocketConnection conexion) {
        String userId = USUARIO_DE.remove(conexion.id());
        if (userId != null) {
            Set<WebSocketConnection> conexiones = EN_LINEA.get(userId);
            if (conexiones != null) {
                conexiones.remove(conexion);
                if (conexiones.isEmpty()) {
                    EN_LINEA.remove(userId);
                }
            }
        }
    }

    /**
     * Recibe un mensaje en formato JSON:
     * {"conversacionId":"...", "texto":"hola"}
     */
    @OnTextMessage
    @Blocking
    public void alRecibir(WebSocketConnection conexion, String mensaje) throws Exception {
        String yo = USUARIO_DE.get(conexion.id());
        if (yo == null) return;

        JsonNode nodo = json.readTree(mensaje);
        if (!nodo.has("conversacionId") || !nodo.has("texto")) return;

        String conv = nodo.get("conversacionId").asText();
        String texto = nodo.get("texto").asText().trim();
        if (texto.isEmpty()) return;

        // 1. Guardar en Neo4j mediante el repositorio
        MensajeGuardado guardado = repo.guardarMensaje(yo, conv, texto);

        // 2. Preparar el payload de salida en JSON
        String salida = json.writeValueAsString(Map.of(
                "tipo", "mensaje",
                "id", guardado.id(),
                "conversacionId", conv,
                "autorId", yo,
                "texto", texto,
                "fecha", guardado.fecha()
        ));

        // 3. Entregar en tiempo real al destinatario y a las pestañas del emisor
        enviarA(guardado.destinatarioId(), salida);
        enviarA(yo, salida);
    }

    private void enviarA(String userId, String payload) {
        Set<WebSocketConnection> conexiones = EN_LINEA.getOrDefault(userId, Set.of());
        for (WebSocketConnection c : conexiones) {
            c.sendTextAndAwait(payload);
        }
    }

    private static String valorDeQuery(String query, String clave) {
        if (query == null) return null;
        for (String par : query.split("&")) {
            String[] kv = par.split("=", 2);
            if (kv.length == 2 && kv[0].equals(clave)) {
                return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}