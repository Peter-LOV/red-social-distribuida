package com.redsocial.common;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

/**
 * Crea las restricciones e índices del grafo al arrancar (es idempotente).
 * Cada área agrega aquí las constraints de sus nodos (Post, Conversacion...).
 */
@ApplicationScoped
public class Neo4jSchemaInit {

    @Inject
    Driver driver;

    void alArrancar(@Observes StartupEvent ev) {
        try (Session s = driver.session()) {
            s.run("CREATE CONSTRAINT usuario_id IF NOT EXISTS FOR (u:Usuario) REQUIRE u.id IS UNIQUE").consume();
            s.run("CREATE CONSTRAINT usuario_email IF NOT EXISTS FOR (u:Usuario) REQUIRE u.email IS UNIQUE").consume();
        }
    }
}
