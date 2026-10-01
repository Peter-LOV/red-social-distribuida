package com.redsocial.usuarios;

import java.util.Map;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

/** Grafo social: seguir, seguidores, seguidos, sugerencias y consultas de red. */
@Path("/social")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class SocialResource {

    @Inject
    GrafoRepository grafo;

    @Inject
    UsuarioRepository usuarios;

    @POST
    @Path("/seguir/{id}")
    public Response seguir(@PathParam("id") String id, @Context SecurityContext ctx) {
        String yo = idActual(ctx);
        if (yo.equals(id)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No puedes seguirte a ti mismo")).build();
        }
        return grafo.seguir(yo, id) ? Response.noContent().build() : noEncontrado();
    }

    @DELETE
    @Path("/seguir/{id}")
    public Response dejarDeSeguir(@PathParam("id") String id, @Context SecurityContext ctx) {
        grafo.dejarDeSeguir(idActual(ctx), id);
        return Response.noContent().build();
    }

    @GET
    @Path("/seguidores/{id}")
    public Response seguidores(@PathParam("id") String id) {
        return usuarios.buscarPorId(id).isEmpty()
                ? noEncontrado()
                : Response.ok(grafo.seguidores(id)).build();
    }

    @GET
    @Path("/seguidos/{id}")
    public Response seguidos(@PathParam("id") String id) {
        return usuarios.buscarPorId(id).isEmpty()
                ? noEncontrado()
                : Response.ok(grafo.seguidos(id)).build();
    }

    @GET
    @Path("/estado/{id}")
    public Response estado(@PathParam("id") String id, @Context SecurityContext ctx) {
        return grafo.estado(idActual(ctx), id)
                .map(e -> Response.ok(e).build())
                .orElseGet(SocialResource::noEncontrado);
    }

    @GET
    @Path("/sugerencias")
    public Response sugerencias(@Context SecurityContext ctx) {
        return Response.ok(grafo.sugerencias(idActual(ctx))).build();
    }

    @GET
    @Path("/en-comun/{id}")
    public Response enComun(@PathParam("id") String id, @Context SecurityContext ctx) {
        return Response.ok(grafo.enComun(idActual(ctx), id)).build();
    }

    @GET
    @Path("/alcanzables")
    public Response alcanzables(@Context SecurityContext ctx) {
        return Response.ok(grafo.alcanzables(idActual(ctx))).build();
    }

    @GET
    @Path("/grafo")
    public Response grafoCompleto() {
        return Response.ok(grafo.grafo()).build();
    }

    /** El nombre del principal es el "subject" del JWT = id del usuario. */
    private static String idActual(SecurityContext ctx) {
        return ctx.getUserPrincipal().getName();
    }

    private static Response noEncontrado() {
        return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Usuario no encontrado")).build();
    }
}
