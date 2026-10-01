package com.redsocial.usuarios;

/** Versión corta de un usuario para listas (seguidores, seguidos, sugerencias, chat). */
public record UsuarioResumen(String id, String nombre, String bio) {
}
