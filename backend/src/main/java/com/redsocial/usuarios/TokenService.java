package com.redsocial.usuarios;

import java.time.Duration;
import java.util.Set;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TokenService {

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    /**
     * El "subject" del token es el id del usuario. Como no definimos "upn",
     * SecurityContext.getUserPrincipal().getName() devuelve ese id.
     */
    public String generar(Usuario u) {
        return Jwt.issuer(issuer)
                .subject(u.id())
                .claim("nombre", u.nombre())
                .groups(Set.of("user"))
                .expiresIn(Duration.ofHours(8))
                .sign();
    }
}
