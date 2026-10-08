package com.redsocial.push;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.Map;

@Path("/push")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PushResource {

    @Inject
    PushRepository repo;

    @Inject
    ClavesVapid claves;

    @GET
    @Path("/clave-publica")
    public Response clavePublica() {
        return Response.ok(new ClavePublicaResponse(claves.publica())).build();
    }

    @POST
    @Path("/suscripcion")
    @Authenticated
    public Response registrarSuscripcion(@NotNull @Valid SuscripcionRequest request, @Context SecurityContext ctx) {
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
        // Solo se borra si la suscripción pertenece al usuario autenticado
        repo.eliminarSuscripcionDe(ctx.getUserPrincipal().getName(), endpoint);
        return Response.noContent().build();
    }
}
