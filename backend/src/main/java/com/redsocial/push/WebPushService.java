package com.redsocial.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redsocial.common.NuevoPostEvent;
import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.event.ObservesAsync;
import jakarta.inject.Inject;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.Map;

@ApplicationScoped
public class WebPushService {

    @Inject
    ClavesVapid claves;

    @ConfigProperty(name = "app.vapid.subject")
    String asunto;

    @Inject
    PushRepository repo;

    @Inject
    ObjectMapper json;

    private PushService push;

    @PostConstruct
    void iniciar() throws GeneralSecurityException {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        push = new PushService(claves.publica(), claves.privada(), asunto);
    }

    private static String servicioDe(String endpoint) {
        try {
            return java.net.URI.create(endpoint).getHost();
        } catch (Exception e) {
            return "servicio push desconocido";
        }
    }

    void alNuevoPost(@ObservesAsync NuevoPostEvent evento) {
        Log.info("==> [PUSH] Evento recibido para autorId: " + evento.autorId() + " (" + evento.autorNombre() + ")");
        try {
            String payload = json.writeValueAsString(Map.of(
                    "titulo", evento.autorNombre() + " publicó algo nuevo",
                    "cuerpo", evento.resumen(),
                    "url", "/post/" + evento.postId()));

            var destinatarios = repo.destinatarios(evento.autorId());
            Log.info("==> [PUSH] Destinatarios encontrados: " + destinatarios.size());

            for (var s : destinatarios) {
                try {
                    // El endpoint completo es una credencial del dispositivo: en el log solo va el servicio
                    Log.info("==> [PUSH] Enviando notificación mediante " + servicioDe(s.endpoint()));
                    // aes128gcm es la codificación estándar (RFC 8291) y la aceptan Chrome, Firefox, Edge y Safari
                    var resp = push.send(
                            new Notification(s.endpoint(), s.p256dh(), s.auth(), payload), Encoding.AES128GCM);
                    int codigo = resp.getStatusLine().getStatusCode();
                    Log.info("==> [PUSH] El servicio push respondió con código HTTP: " + codigo);

                    if (codigo == 404 || codigo == 410) {
                        Log.warn("==> [PUSH] Suscripción expirada/inválida. Eliminando de Neo4j.");
                        repo.eliminarSuscripcion(s.endpoint());
                    }
                } catch (Exception e) {
                    Log.error("==> [PUSH] Error enviando mediante " + servicioDe(s.endpoint()), e);
                }
            }
        } catch (Exception e) {
            Log.error("==> [PUSH] Error preparando la notificación", e);
        }
    }
}
