package com.redsocial.push;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.util.Base64;

import org.junit.jupiter.api.Test;

/** Las llaves VAPID deben tener el formato que exige el estandar Web Push (RFC 8292). */
class GeneradorVapidTest {

    @Test
    void laLlavePublicaEsUnPuntoP256SinComprimir() throws Exception {
        GeneradorVapid.Par par = GeneradorVapid.generar();
        byte[] publica = Base64.getUrlDecoder().decode(par.publica());
        assertEquals(65, publica.length);
        assertEquals(0x04, publica[0]);
    }

    @Test
    void laLlavePrivadaMide32Bytes() throws Exception {
        GeneradorVapid.Par par = GeneradorVapid.generar();
        assertEquals(32, Base64.getUrlDecoder().decode(par.privada()).length);
    }

    @Test
    void cadaLlamadaGeneraUnParDistinto() throws Exception {
        assertNotEquals(GeneradorVapid.generar().privada(), GeneradorVapid.generar().privada());
    }
}
