package com.redsocial.usuarios;

/** Uso interno: usuario + hash, solo para verificar el login. */
public record UsuarioCredenciales(Usuario usuario, String passwordHash) {
}
