package com.redsocial.posts;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Response;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

/**
 * Sirve las imagenes. Es publico porque un img no puede enviar el token; las claves son UUID
 * imposibles de adivinar y se valida su formato para que nadie pida otros objetos del bucket.
 */
@Path("/media")
public class MediaResource {

    @Inject
    AlmacenamientoService almacenamiento;

    @GET
    @Path("/{clave}")
    public Response obtener(@PathParam("clave") String clave) {
        if (!clave.matches("^[a-f0-9-]{36}\\.(jpg|png|webp|gif)$")) {
            return Response.status(404).build();
        }
        try {
            var objeto = almacenamiento.obtener(clave);
            CacheControl cache = new CacheControl();
            cache.setMaxAge(86400);
            return Response.ok(objeto).type(objeto.response().contentType()).cacheControl(cache).build();
        } catch (NoSuchKeyException e) {
            return Response.status(404).build();
        }
    }
}