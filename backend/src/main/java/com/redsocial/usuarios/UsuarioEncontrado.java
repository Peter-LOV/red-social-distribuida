package com.redsocial.usuarios;

/** Resultado de la busqueda de usuarios por nombre; "sigo" indica si el usuario autenticado ya lo sigue. */
public record UsuarioEncontrado(String id, String nombre, String bio, boolean sigo) {
}
