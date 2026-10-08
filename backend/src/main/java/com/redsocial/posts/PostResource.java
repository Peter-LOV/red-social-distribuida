package com.redsocial.posts;

import java.util.Map;
import java.util.Optional;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import com.redsocial.common.NuevoPostEvent;

import io.quarkus.logging.Log;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

/** Publicaciones y reacciones. Requiere token JWT. */
@Path("/posts")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class PostResource {

    private static final int MAX_TEXTO = 500;

    @Inject
    PostRepository repo;

    @Inject
    AlmacenamientoService almacenamiento;

    @Inject
    Event<NuevoPostEvent> eventos;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response crear(@RestForm String texto,
                          @RestForm("imagen") FileUpload imagen,
                          @Context SecurityContext ctx) {
        if (texto == null || texto.isBlank()) {
            return error(400, "El texto es obligatorio");
        }
        if (texto.trim().length() > MAX_TEXTO) {
            return error(400, "El texto no puede superar los " + MAX_TEXTO + " caracteres");
        }
        String autorId = idActual(ctx);
        String mediaKey = null;
        if (imagen != null && imagen.size() > 0) {
            try {
                mediaKey = almacenamiento.subir(imagen);
            } catch (BadRequestException e) {
                return error(400, e.getMessage());
            } catch (Exception e) {
                Log.error("==> [S3] No se pudo guardar la imagen", e);
                return error(503, "No pudimos guardar la imagen. Intenta nuevamente en unos segundos.");
            }
        }

        Optional<Post> creado;
        try {
            creado = repo.crear(autorId, texto.trim(), mediaKey);
        } catch (RuntimeException e) {
            borrarImagenHuerfana(mediaKey);   // Neo4j fallo despues de subir la imagen
            throw e;
        }
        if (creado.isEmpty()) {
            borrarImagenHuerfana(mediaKey);
            return error(404, "Usuario no encontrado");
        }
        Post post = creado.get();

        // Aviso a la Persona D (Web Push) mediante un evento. No esperamos su resultado.
        String resumen = post.texto().length() > 80 ? post.texto().substring(0, 80) + "..." : post.texto();
        eventos.fireAsync(new NuevoPostEvent(post.id(), autorId, post.autorNombre(), resumen));

        return Response.status(201).entity(post).build();
    }

    /** Publicaciones de un autor, de la mas reciente a la mas antigua (pestana "Publicaciones" del perfil). */
    @GET
    public Response deAutor(@QueryParam("autor") String autor,
                            @QueryParam("pagina") @DefaultValue("0") int pagina,
                            @Context SecurityContext ctx) {
        if (autor == null || autor.isBlank()) {
            return error(400, "El par\u00e1metro autor es obligatorio");
        }
        return Response.ok(repo.deAutor(autor, idActual(ctx), Math.max(pagina, 0))).build();
    }

    @GET
    @Path("/{id}")
    public Response detalle(@PathParam("id") String id, @Context SecurityContext ctx) {
        return repo.buscarPorId(id, idActual(ctx))
                .map(p -> Response.ok(p).build())
                .orElseGet(() -> error(404, "Publicaci\u00f3n no encontrada"));
    }

    @POST
    @Path("/{id}/reaccion")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response reaccionar(@PathParam("id") String id, @Valid ReaccionRequest req,
                               @Context SecurityContext ctx) {
        return repo.reaccionar(idActual(ctx), id, req.tipo())
                .map(total -> Response.ok(Map.of("reacciones", total, "yaReaccione", true)).build())
                .orElseGet(() -> error(404, "Publicaci\u00f3n no encontrada"));
    }

    @DELETE
    @Path("/{id}/reaccion")
    public Response quitarReaccion(@PathParam("id") String id, @Context SecurityContext ctx) {
        repo.quitarReaccion(idActual(ctx), id);
        return Response.noContent().build();
    }

    private void borrarImagenHuerfana(String mediaKey) {
        if (mediaKey == null) {
            return;
        }
        try {
            almacenamiento.eliminar(mediaKey);
        } catch (Exception e) {
            Log.warn("==> [S3] No se pudo borrar la imagen huerfana " + mediaKey, e);
        }
    }

    /** El nombre del principal es el "subject" del JWT = id del usuario. */
    static String idActual(SecurityContext ctx) {
        return ctx.getUserPrincipal().getName();
    }

    static Response error(int estado, String mensaje) {
        return Response.status(estado).entity(Map.of("error", mensaje)).build();
    }
}