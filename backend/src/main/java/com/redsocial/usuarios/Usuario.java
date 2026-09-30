package com.redsocial.usuarios;

/** Representación pública de un usuario (nunca incluye el hash de la contraseña). */
public record Usuario(String id, String nombre, String email, String bio) {
}
