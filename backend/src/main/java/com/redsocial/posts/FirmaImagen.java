package com.redsocial.posts;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Reconoce el tipo real de una imagen por sus primeros bytes ("firma" o magic number).
 * El tipo que declara el cliente (Content-Type) no es de fiar: cualquiera puede enviar
 * un archivo arbitrario diciendo que es image/png.
 */
public final class FirmaImagen {

    private static final int BYTES_NECESARIOS = 12;

    private FirmaImagen() {
    }

    /** Devuelve image/jpeg, image/png, image/gif o image/webp; null si no es ninguna de ellas. */
    public static String detectar(Path archivo) throws IOException {
        byte[] b = new byte[BYTES_NECESARIOS];
        int leidos;
        try (InputStream entrada = Files.newInputStream(archivo)) {
            leidos = entrada.readNBytes(b, 0, BYTES_NECESARIOS);
        }
        return detectar(b, leidos);
    }

    static String detectar(byte[] b, int leidos) {
        if (leidos >= 3 && sinSigno(b[0]) == 0xFF && sinSigno(b[1]) == 0xD8 && sinSigno(b[2]) == 0xFF) {
            return "image/jpeg";
        }
        if (leidos >= 8 && sinSigno(b[0]) == 0x89 && texto(b, 1, "PNG")
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (leidos >= 6 && (texto(b, 0, "GIF87a") || texto(b, 0, "GIF89a"))) {
            return "image/gif";
        }
        if (leidos >= 12 && texto(b, 0, "RIFF") && texto(b, 8, "WEBP")) {
            return "image/webp";
        }
        return null;
    }

    private static int sinSigno(byte valor) {
        return valor & 0xFF;
    }

    private static boolean texto(byte[] b, int desde, String esperado) {
        byte[] bytes = esperado.getBytes(StandardCharsets.US_ASCII);
        if (desde + bytes.length > b.length) {
            return false;
        }
        for (int i = 0; i < bytes.length; i++) {
            if (b[desde + i] != bytes[i]) {
                return false;
            }
        }
        return true;
    }
}
