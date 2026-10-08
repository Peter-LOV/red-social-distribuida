package com.redsocial.chat;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.Map;

@Path("/chat")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChatResource {

    @Inject
    ChatRepository repo;

    @POST
    @Path("/conversaciones")
    public Response iniciarConversacion(@Valid CrearConversacionRequest req, @Context SecurityContext ctx) {
        String miId = ctx.getUserPrincipal().getName();
        if (miId.equals(req.usuarioId())) {
            return Response.status(400).entity(Map.of("error", "No puedes iniciar un chat contigo mismo")).build();
        }
        return repo.obtenerOCrearConversacion(miId, req.usuarioId())
                .map(convId -> Response.ok(Map.of("conversacionId", convId)).build())
                .orElseGet(() -> Response.status(404).entity(Map.of("error", "Usuario no encontrado")).build());
    }

    @GET
    @Path("/conversaciones")
    public List<ConversacionResumen> listarConversaciones(@Context SecurityContext ctx) {
        String miId = ctx.getUserPrincipal().getName();
        return repo.misConversaciones(miId);
    }

    @GET
    @Path("/conversaciones/{id}/mensajes")
    public List<MensajeDetalle> historial(@PathParam("id") String convId, @Context SecurityContext ctx) {
        String miId = ctx.getUserPrincipal().getName();
        return repo.obtenerHistorial(miId, convId);
    }
}