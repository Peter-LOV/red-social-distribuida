package com.redsocial.push;

import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

/**
 * Genera un par de llaves VAPID (curva P-256) en el mismo formato que
 * "npx web-push generate-vapid-keys": base64url sin relleno, con la llave pública
 * como punto sin comprimir (65 bytes) y la privada como entero de 32 bytes.
 */
public final class GeneradorVapid {

    private static final int TAMANO = 32;

    private GeneradorVapid() {
    }

    public record Par(String publica, String privada) {
    }

    public static Par generar() throws GeneralSecurityException {
        KeyPairGenerator generador = KeyPairGenerator.getInstance("EC");
        generador.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair par = generador.generateKeyPair();
        ECPublicKey publica = (ECPublicKey) par.getPublic();
        ECPrivateKey privada = (ECPrivateKey) par.getPrivate();

        byte[] punto = new byte[1 + 2 * TAMANO];
        punto[0] = 0x04; // punto sin comprimir: 0x04 || X || Y
        copiar(publica.getW().getAffineX(), punto, 1);
        copiar(publica.getW().getAffineY(), punto, 1 + TAMANO);

        byte[] escalar = new byte[TAMANO];
        copiar(privada.getS(), escalar, 0);

        Base64.Encoder base64url = Base64.getUrlEncoder().withoutPadding();
        return new Par(base64url.encodeToString(punto), base64url.encodeToString(escalar));
    }

    /** Escribe n como entero sin signo de 32 bytes (big-endian) a partir de la posición indicada. */
    private static void copiar(BigInteger n, byte[] destino, int desde) {
        byte[] bytes = n.toByteArray(); // puede traer un 0x00 inicial de signo o venir más corto
        int largo = Math.min(bytes.length, TAMANO);
        System.arraycopy(bytes, bytes.length - largo, destino, desde + TAMANO - largo, largo);
    }
}
