package com.redsocial.posts;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

/** Feed personalizado: publicaciones de las personas a las que sigo (20 por pagina). */
@Path("/feed")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class FeedResource {

    @Inject
    PostRepository repo;

    @GET
    public Response feed(@QueryParam("pagina") @DefaultValue("0") int pagina, @Context SecurityContext ctx) {
        return Response.ok(repo.feed(PostResource.idActual(ctx), Math.max(pagina, 0))).build();
    }
}