package com.redsocial.common;

import java.util.Map;

import org.neo4j.driver.exceptions.ServiceUnavailableException;

import io.quarkus.logging.Log;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/**
 * Si Neo4j no responde, la API contesta 503 con un mensaje claro en lugar de un 500 generico.
 * El driver se reconecta solo cuando la base de datos vuelve: no hace falta reiniciar el backend.
 */
@Provider
public class BaseDeDatosNoDisponibleMapper implements ExceptionMapper<ServiceUnavailableException> {

    @Override
    public Response toResponse(ServiceUnavailableException e) {
        Log.error("==> [NEO4J] Base de datos no disponible: " + e.getMessage());
        return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("error", "La base de datos no está disponible en este momento. Intenta nuevamente en unos segundos."))
                .build();
    }
}
