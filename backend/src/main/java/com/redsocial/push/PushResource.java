package com.redsocial.push;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;

@Path("/push")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PushResource {

    @Inject
    PushRepository repo;

    @ConfigProperty(name = "app.vapid.public-key")
    String clavePublica;

    @GET
    @Path("/clave-publica")
    public Response clavePublica() {
        return Response.ok(new ClavePublicaResponse(clavePublica)).build();
    }

    @POST
    @Path("/suscripcion")
    @Authenticated
    public Response registrarSuscripcion(SuscripcionRequest request, @Context SecurityContext ctx) {
        String usuarioId = ctx.getUserPrincipal().getName();
        repo.guardarSuscripcion(usuarioId, request.endpoint(), request.keys().p256dh(), request.keys().auth());
        return Response.noContent().build();
    }

    @DELETE
    @Path("/suscripcion")
    @Authenticated
    public Response eliminarSuscripcion(@QueryParam("endpoint") String endpoint, @Context SecurityContext ctx) {
        if (endpoint == null || endpoint.isBlank()) {
            return Response.status(400).entity(Map.of("error", "endpoint es requerido")).build();
        }
        repo.eliminarSuscripcion(endpoint);
        return Response.noContent().build();
    }
}
