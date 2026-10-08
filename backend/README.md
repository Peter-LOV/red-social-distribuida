# Backend — Quarkus + Java 21

API REST, servidor WebSocket y envío de Web Push de la red social. La documentación completa
(arquitectura, endpoints, consultas Cypher y decisiones) está en el [README principal](../README.md).

## Estructura

```text
src/main/java/com/redsocial/
├── common/     Esquema de Neo4j, evento NuevoPostEvent y respuesta 503 si Neo4j no responde
├── usuarios/   Registro, login (JWT + bcrypt), perfiles, búsqueda y grafo social
├── posts/      Publicaciones, feed, reacciones y almacenamiento S3
├── chat/       Conversaciones (REST) y mensajes en tiempo real (WebSocket)
└── push/       Suscripciones y envío de Web Push (VAPID)
```

Cada módulo sigue la misma separación: `*Resource` (HTTP), `*Repository` (Cypher) y `record` como DTO.

## Ejecutar

Con Docker (recomendado), desde la raíz del repositorio:

```bash
docker compose up -d --build
```

En modo desarrollo (necesita JDK 21 y Neo4j + RustFS levantados con `docker compose up -d neo4j rustfs`):

```bash
./mvnw quarkus:dev
```

## Pruebas

```bash
./mvnw test
```

Pruebas unitarias de las piezas sin dependencias externas: generación de llaves VAPID
(`GeneradorVapidTest`) y detección del tipo real de una imagen (`FirmaImagenTest`).
