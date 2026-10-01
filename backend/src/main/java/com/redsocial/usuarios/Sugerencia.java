package com.redsocial.usuarios;

import java.util.List;

/**
 * Usuario sugerido.
 *
 * @param enComun    cuántos de mis seguidos ya lo siguen
 * @param via        nombres de algunos de esos seguidos (para mostrar "Lo siguen X e Y")
 * @param popularidad cuántos seguidores tiene en total (desempate)
 */
public record Sugerencia(String id, String nombre, int enComun, List<String> via, long popularidad) {
}
