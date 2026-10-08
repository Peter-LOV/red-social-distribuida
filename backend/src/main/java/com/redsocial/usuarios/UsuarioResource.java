package com.redsocial.usuarios;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

/** Perfiles. Requiere token JWT (Authorization: Bearer ...). */
@Path("/usuarios")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    UsuarioRepository repo;

    @GET
    @Path("/me")
    public Response miPerfil(@Context SecurityContext ctx) {
        return respuesta(repo.buscarPorId(idActual(ctx)));
    }

    @PUT
    @Path("/me")
    public Response editarMiPerfil(@Context SecurityContext ctx, @Valid ActualizarPerfilRequest req) {
        return respuesta(repo.actualizarPerfil(idActual(ctx), req.nombre().trim(), req.bio()));
    }

    /** Busqueda de usuarios por nombre: GET /usuarios?buscar=texto (minimo 2 caracteres). */
    @GET
    public Response buscar(@QueryParam("buscar") String texto, @Context SecurityContext ctx) {
        String consulta = texto == null ? "" : texto.trim();
        if (consulta.length() < 2) {
            return Response.ok(List.of()).build();
        }
        if (consulta.length() > 50) {
            consulta = consulta.substring(0, 50);
        }
        return Response.ok(repo.buscarPorNombre(idActual(ctx), consulta)).build();
    }

    @GET
    @Path("/{id}")
    public Response perfil(@PathParam("id") String id, @Context SecurityContext ctx) {
        boolean esMio = id.equals(idActual(ctx));
        // El email es un dato privado: solo viaja en el perfil propio
        return respuesta(repo.buscarPorId(id)
                .map(u -> esMio ? u : new Usuario(u.id(), u.nombre(), null, u.bio())));
    }

    /** El nombre del principal es el "subject" del JWT = id del usuario. */
    private static String idActual(SecurityContext ctx) {
        return ctx.getUserPrincipal().getName();
    }

    private static Response respuesta(Optional<Usuario> u) {
        return u.map(x -> Response.ok(x).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Usuario no encontrado")).build());
    }
}
