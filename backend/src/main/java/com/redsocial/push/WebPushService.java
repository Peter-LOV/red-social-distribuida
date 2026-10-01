package com.redsocial.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redsocial.common.NuevoPostEvent;
import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.event.ObservesAsync;
import jakarta.inject.Inject;
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

    @ConfigProperty(name = "app.vapid.public-key")
    String clavePublica;

    @ConfigProperty(name = "app.vapid.private-key")
    String clavePrivada;

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
        push = new PushService(clavePublica, clavePrivada, asunto);
    }

    void alNuevoPost(@ObservesAsync NuevoPostEvent evento) {
        try {
            String payload = json.writeValueAsString(Map.of(
                    "titulo", evento.autorNombre() + " publicó algo nuevo",
                    "cuerpo", evento.resumen(),
                    "url", "/post/" + evento.postId()));

            for (var s : repo.destinatarios(evento.autorId())) {
                try {
                    var resp = push.send(new Notification(s.endpoint(), s.p256dh(), s.auth(), payload));
                    int codigo = resp.getStatusLine().getStatusCode();
                    if (codigo == 404 || codigo == 410) {
                        repo.eliminarSuscripcion(s.endpoint());
                    }
                } catch (Exception e) {
                    Log.warn("No se pudo enviar push a " + s.endpoint(), e);
                }
            }
        } catch (Exception e) {
            Log.error("Error preparando la notificación", e);
        }
    }
}
