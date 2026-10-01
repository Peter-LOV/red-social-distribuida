package com.redsocial.posts;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

/** Constraints e indices de (:Post). Idempotente: se ejecuta en cada arranque. */
@ApplicationScoped
public class PostsSchemaInit {

    @Inject
    Driver driver;

    void alArrancar(@Observes StartupEvent ev) {
        try (Session s = driver.session()) {
            s.run("CREATE CONSTRAINT post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.id IS UNIQUE").consume();
            s.run("CREATE INDEX post_fecha IF NOT EXISTS FOR (p:Post) ON (p.fecha)").consume();
        }
    }
}