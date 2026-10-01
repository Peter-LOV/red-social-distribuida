package com.redsocial.push;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

import jakarta.inject.Inject;

@ApplicationScoped
public class PushSchemaInit {

    @Inject
    Driver driver;

    void alArrancar(@Observes StartupEvent ev) {
        try (Session s = driver.session()) {
            s.run("CREATE CONSTRAINT suscripcion_endpoint IF NOT EXISTS FOR (s:Suscripcion) REQUIRE s.endpoint IS UNIQUE");
        }
    }
}
