package com.redsocial.usuarios;

import java.util.List;

/** Formato pensado para react-force-graph: nodos y enlaces (source -> target). */
public record GrafoResponse(List<Nodo> nodos, List<Enlace> enlaces) {

    public record Nodo(String id, String nombre) {
    }

    public record Enlace(String source, String target) {
    }
}
