package com.redsocial.usuarios;

/** Relación entre el usuario autenticado y otro usuario, más sus contadores. */
public record EstadoSocial(boolean sigo, boolean meSigue, long seguidores, long seguidos) {
}
