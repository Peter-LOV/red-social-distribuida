package com.redsocial.usuarios;

/** Usuario alcanzable siguiendo relaciones SIGUE; "saltos" es la distancia mínima. */
public record Alcanzable(String id, String nombre, int saltos) {
}
