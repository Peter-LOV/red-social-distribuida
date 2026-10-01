package com.redsocial.posts;

/** Publicacion tal como la ve el cliente (detalle y feed). mediaKey puede ser null. */
public record Post(
        String id,
        String texto,
        String mediaKey,
        String fecha,
        String autorId,
        String autorNombre,
        long reacciones,
        boolean yaReaccione) {
}