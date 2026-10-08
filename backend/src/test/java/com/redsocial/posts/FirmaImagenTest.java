package com.redsocial.posts;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

/** El tipo de una imagen se decide por su contenido, no por el Content-Type que declara el cliente. */
class FirmaImagenTest {

    private static String detectar(int... valores) {
        byte[] b = new byte[12];
        for (int i = 0; i < valores.length && i < b.length; i++) {
            b[i] = (byte) valores[i];
        }
        return FirmaImagen.detectar(b, Math.min(valores.length, b.length));
    }

    @Test
    void reconoceJpeg() {
        assertEquals("image/jpeg", detectar(0xFF, 0xD8, 0xFF, 0xE0));
    }

    @Test
    void reconocePng() {
        assertEquals("image/png", detectar(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A));
    }

    @Test
    void reconoceGif() {
        assertEquals("image/gif", detectar('G', 'I', 'F', '8', '9', 'a'));
    }

    @Test
    void reconoceWebp() {
        assertEquals("image/webp", detectar('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'));
    }

    @Test
    void rechazaUnHtmlDisfrazadoDeImagen() {
        byte[] html = "<html><script>".getBytes(StandardCharsets.US_ASCII);
        assertNull(FirmaImagen.detectar(html, 12));
    }

    @Test
    void rechazaUnArchivoVacioOTruncado() {
        assertNull(detectar());
        assertNull(detectar(0xFF, 0xD8));
    }
}
