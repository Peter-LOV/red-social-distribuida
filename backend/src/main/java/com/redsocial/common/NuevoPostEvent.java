package com.redsocial.common;

/**
 * Evento que la Persona B dispara al crear un post y que la Persona D escucha para enviar Web Push.
 * Si D ya subio este archivo a main, usar la version de main (debe ser identica).
 */
public record NuevoPostEvent(String postId, String autorId, String autorNombre, String resumen) {
}