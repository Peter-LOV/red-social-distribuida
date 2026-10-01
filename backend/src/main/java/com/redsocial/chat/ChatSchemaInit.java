package com.redsocial.chat;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;

@ApplicationScoped
public class ChatSchemaInit {

    @Inject
    Driver driver;

    void onStart(@Observes StartupEvent ev) {
        try (Session session = driver.session()) {
            session.executeWrite(tx -> {
                tx.run("CREATE CONSTRAINT conversacion_id IF NOT EXISTS FOR (c:Conversacion) REQUIRE c.id IS UNIQUE").consume();
                tx.run("CREATE CONSTRAINT mensaje_id IF NOT EXISTS FOR (m:Mensaje) REQUIRE m.id IS UNIQUE").consume();
                tx.run("CREATE INDEX mensaje_fecha IF NOT EXISTS FOR (m:Mensaje) ON (m.fecha)").consume();
                return null;
            });
        }
    }
}