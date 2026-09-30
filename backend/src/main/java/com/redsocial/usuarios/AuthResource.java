package com.redsocial.usuarios;

import java.util.Map;

import org.neo4j.driver.exceptions.ClientException;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/** Endpoints públicos: registro e inicio de sesión. */
@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    UsuarioRepository repo;

    @Inject
    TokenService tokens;

    @POST
    @Path("/registro")
    public Response registrar(@Valid RegistroRequest req) {
        String email = req.email().trim().toLowerCase();
        if (repo.buscarCredencialesPorEmail(email).isPresent()) {
            return error(Response.Status.CONFLICT, "El email ya está registrado");
        }
        try {
            Usuario u = repo.crear(req.nombre().trim(), email, BcryptUtil.bcryptHash(req.password()));
            return Response.status(Response.Status.CREATED)
                    .entity(new TokenResponse(tokens.generar(u), u)).build();
        } catch (ClientException e) {
            // Carrera entre dos registros simultáneos: la constraint UNIQUE de Neo4j lo detiene
            return error(Response.Status.CONFLICT, "El email ya está registrado");
        }
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req) {
        var cred = repo.buscarCredencialesPorEmail(req.email().trim().toLowerCase());
        if (cred.isEmpty() || !BcryptUtil.matches(req.password(), cred.get().passwordHash())) {
            return error(Response.Status.UNAUTHORIZED, "Credenciales inválidas");
        }
        Usuario u = cred.get().usuario();
        return Response.ok(new TokenResponse(tokens.generar(u), u)).build();
    }

    private static Response error(Response.Status status, String mensaje) {
        return Response.status(status).entity(Map.of("error", mensaje)).build();
    }
}
