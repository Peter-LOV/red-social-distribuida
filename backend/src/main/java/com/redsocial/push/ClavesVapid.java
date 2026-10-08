package com.redsocial.push;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Única fuente de las llaves VAPID del servidor.
 *
 * Orden de búsqueda:
 *   1. Variables de entorno VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY (si el equipo quiere fijarlas).
 *   2. Archivos guardados en app.vapid.keys-dir (en Docker es un volumen persistente).
 *   3. Si no hay ninguna, se genera un par nuevo y se guarda en ese directorio.
 *
 * Así "docker compose up" funciona sin generar llaves a mano y las llaves sobreviven a los reinicios.
 */
@ApplicationScoped
public class ClavesVapid {

    private static final String ARCHIVO_PUBLICA = "vapid-public.key";
    private static final String ARCHIVO_PRIVADA = "vapid-private.key";

    @ConfigProperty(name = "app.vapid.public-key")
    Optional<String> publicaConfigurada;

    @ConfigProperty(name = "app.vapid.private-key")
    Optional<String> privadaConfigurada;

    @ConfigProperty(name = "app.vapid.keys-dir", defaultValue = "vapid-keys")
    String directorio;

    private String publica;
    private String privada;

    @PostConstruct
    void cargar() {
        String pub = publicaConfigurada.map(String::trim).orElse("");
        String priv = privadaConfigurada.map(String::trim).orElse("");
        if (!pub.isEmpty() && !priv.isEmpty()) {
            publica = pub;
            privada = priv;
            Log.info("==> [PUSH] Llaves VAPID tomadas de las variables de entorno");
            return;
        }

        Path carpeta = Path.of(directorio);
        Path archivoPublica = carpeta.resolve(ARCHIVO_PUBLICA);
        Path archivoPrivada = carpeta.resolve(ARCHIVO_PRIVADA);
        try {
            if (Files.isReadable(archivoPublica) && Files.isReadable(archivoPrivada)) {
                publica = Files.readString(archivoPublica).trim();
                privada = Files.readString(archivoPrivada).trim();
                Log.info("==> [PUSH] Llaves VAPID leídas de " + carpeta.toAbsolutePath());
                return;
            }
        } catch (IOException e) {
            Log.warn("==> [PUSH] No se pudieron leer las llaves VAPID guardadas; se generan nuevas", e);
        }

        try {
            GeneradorVapid.Par par = GeneradorVapid.generar();
            publica = par.publica();
            privada = par.privada();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudieron generar las llaves VAPID", e);
        }
        try {
            Files.createDirectories(carpeta);
            Files.writeString(archivoPublica, publica);
            Files.writeString(archivoPrivada, privada);
            Log.info("==> [PUSH] Llaves VAPID generadas y guardadas en " + carpeta.toAbsolutePath());
        } catch (IOException e) {
            Log.warn("==> [PUSH] Llaves VAPID generadas pero no se pudieron guardar en "
                    + carpeta.toAbsolutePath() + ": dejarán de valer al reiniciar el backend", e);
        }
    }

    public String publica() {
        return publica;
    }

    public String privada() {
        return privada;
    }
}
