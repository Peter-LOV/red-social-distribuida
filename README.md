# Red Social Distribuida

Aplicación web distribuida que implementa las funcionalidades esenciales de una red social. El objetivo es **diseñar, implementar y justificar una arquitectura distribuida**: cada componente tiene una responsabilidad clara y se comunica mediante el mecanismo adecuado (REST, WebSocket, Web Push, Cypher, API S3).

Proyecto de la asignatura Sistemas Distribuidos.

---

## Índice

1. [Integrantes](#1-integrantes)
2. [Estado del proyecto](#2-estado-del-proyecto)
3. [Arquitectura](#3-arquitectura)
4. [Tecnologías](#4-tecnologías)
5. [Requisitos previos](#5-requisitos-previos)
6. [Puesta en marcha con Docker](#6-puesta-en-marcha-con-docker) ⭐ Recomendado
7. [Puesta en marcha (modo dev local)](#7-puesta-en-marcha-modo-dev-local)
8. [Uso diario](#8-uso-diario)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Puertos usados](#10-puertos-usados)
11. [Estructura del repositorio](#11-estructura-del-repositorio)
12. [API REST (endpoints actuales)](#12-api-rest-endpoints-actuales)
13. [Modelo del grafo](#13-modelo-del-grafo)
14. [Flujo de trabajo en Git](#14-flujo-de-trabajo-en-git)
15. [Solución de problemas](#15-solución-de-problemas)
16. [Decisiones técnicas](#16-decisiones-técnicas)

---

## 1. Integrantes

| Integrante | Usuario GitHub | Área principal |
|---|---|---|
| _Nombre 1_ | @usuario1 | A. Usuarios y grafo social |
| _Nombre 2_ | @usuario2 | B. Contenido, S3, feed y reacciones |
| _Nombre 3_ | @usuario3 | C. Chat en tiempo real (WebSocket) |
| _Nombre 4_ | @usuario4 | D. Infraestructura, Web Push, diagrama y documentación |

> Completar con los datos reales del equipo.

---

## 2. Estado del proyecto

- [x] Infraestructura: Neo4j y almacenamiento S3 con Docker Compose
- [x] Backend base con Quarkus
- [x] Registro e inicio de sesión (bcrypt + JWT)
- [x] Perfiles de usuario (consultar y editar)
- [x] Grafo social: seguir, seguidores, seguidos y sugerencias
- [x] Publicaciones con imagen en S3
- [x] Feed personalizado y reacciones
- [x] Chat en tiempo real (WebSocket)
- [x] Notificaciones Web Push
- [x] Frontend React
- [x] Dockerización completa (backend y frontend en contenedores)

---

## 3. Arquitectura

```text
                     ┌─────────────┐
                     │    React    │
                     └──────┬──────┘
                            │ REST / WebSocket
                     ┌──────▼──────┐
                     │   Quarkus   │
                     │   Backend   │
                     └───┬────┬────┘
                         │    │
                 Cypher  │    │  API S3
                (Bolt)   │    │
                  ┌──────▼─┐ ┌▼─────────────┐
                  │ Neo4j  │ │ Object       │
                  │        │ │ Storage (S3) │
                  └────────┘ └──────────────┘
                         │
                     Web Push (VAPID)
                         │
                  ┌──────▼──────┐
                  │   Usuario   │
                  └─────────────┘
```

| Necesidad | Mecanismo | Componente |
|---|---|---|
| Operaciones CRUD y consultas | REST / HTTP + JSON | Quarkus |
| Relaciones sociales | Base de datos de grafos (Cypher) | Neo4j |
| Archivos de las publicaciones | Object Storage (API S3) | RustFS |
| Mensajería bidireccional | WebSocket | Quarkus |
| Notificaciones fuera de la app | Web Push | Quarkus + Service Worker |
| Despliegue reproducible | Contenedores | Docker Compose |

---

## 4. Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | React (Vite) |
| Backend | Quarkus 3.39 + Java 21 + Maven |
| Base de datos de grafos | Neo4j 5 Community |
| Almacenamiento de archivos | RustFS (compatible con S3) |
| Autenticación | JWT (RSA) + bcrypt |
| Tiempo real | WebSocket (`quarkus-websockets-next`) |
| Notificaciones | Web Push (VAPID) |
| Contenedores | Docker / Docker Compose |

---

## 5. Requisitos previos

**Opción A - Docker (Recomendado):**
- Solo necesitas Docker Desktop instalado
- Ver guía completa en [README-DOCKER.md](README-DOCKER.md)

**Opción B - Modo dev local:**
- Git for Windows
- Docker Desktop
- JDK 21 (Temurin)
- Node.js 20+

---

## 6. Puesta en marcha con Docker ⭐

Esta es la forma más rápida de probar el proyecto sin instalar dependencias.

1. **Clonar el repositorio:**
   ```powershell
   git clone https://github.com/Peter-LOV/red-social-distribuida.git
   cd red-social-distribuida
   ```

2. **Configurar credenciales:**
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```
   Cambia `NEO4J_PASSWORD`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` y las llaves VAPID.

3. **Levantar todo:**
   ```powershell
   docker compose up -d --build
   ```

4. **Acceder:**
   - Frontend: http://localhost:80
   - Swagger: http://localhost:8080/q/swagger-ui
   - Neo4j: http://localhost:7474

Para instrucciones detalladas, ver [README-DOCKER.md](README-DOCKER.md).

---

## 7. Puesta en marcha (modo dev local)

Si eres desarrollador y quieres recarga en caliente (hot reload):

### Paso 1: Clonar y configurar

```powershell
git clone https://github.com/Peter-LOV/red-social-distribuida.git
cd red-social-distribuida
Copy-Item .env.example .env
notepad .env
```

Cambia las credenciales en `.env` y cópialo a `backend/.env`.

### Paso 2: Verificar Java 21

```powershell
java -version
```

Si no dice `21.x`, ajusta `JAVA_HOME`:
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.1-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

### Paso 3: Levantar infraestructura

```powershell
docker compose up -d
```

### Paso 4: Generar llaves JWT

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-jwt-keys.ps1
```

### Paso 5: Arrancar backend

```powershell
cd backend
.\mvnw quarkus:dev
```

### Paso 6: Arrancar frontend (otra terminal)

```powershell
cd frontend
npm run dev
```

---

## 8. Uso diario

### Con Docker:

```powershell
docker compose up -d      # Levantar
docker compose down       # Detener
```

### Modo dev local:

```powershell
docker compose up -d              # Infraestructura
cd backend && .\mvnw quarkus:dev # Backend
cd frontend && npm run dev          # Frontend
```

---

## 9. Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEO4J_PASSWORD` | Contraseña de Neo4j (mínimo 8 caracteres) | `TuClaveNeo4j2026` |
| `S3_ACCESS_KEY` | Usuario S3 (mínimo 8 caracteres) | `tuusuarios3` |
| `S3_SECRET_KEY` | Contraseña S3 (mínimo 8 caracteres) | `TuClaveSecretaLarga` |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID (generada con `npx web-push generate-vapid-keys`) | `BBtMvrOmBrpWspD1iLgb...` |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID | `KBEzGlWoyNi85Je2419Tw...` |
| `VAPID_SUBJECT` | Subject VAPID | `mailto:admin@redsocial.local` |

---

## 10. Puertos usados

| Puerto | Servicio |
|---|---|
| 80 | Frontend (Docker) |
| 8080 | Backend / Swagger |
| 7474 | Neo4j Browser |
| 7687 | Neo4j Bolt |
| 9000 | API S3 (RustFS) |
| 9001 | Consola RustFS |
| 5173 | Frontend (modo dev) |

---

## 11. Estructura del repositorio

```text
red-social-distribuida/
├── backend/                     Quarkus (Java 21, Maven)
│   └── src/main/java/com/redsocial/
│       ├── common/              Código compartido
│       ├── usuarios/            Registro, login, perfiles, grafo
│       ├── posts/               Publicaciones, S3, feed
│       ├── chat/                WebSocket
│       └── push/                Web Push
├── frontend/                    React (Vite)
├── scripts/                     Scripts de ayuda
├── docs/                        Documentación
├── docker-compose.yml           Todos los servicios
├── README.md                    Este archivo
└── README-DOCKER.md            Guía específica de Docker
```

---

## 12. API REST (endpoints actuales)

Documentación interactiva: http://localhost:8080/q/swagger-ui

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/registro` | No | Registrar usuario |
| `POST` | `/auth/login` | No | Iniciar sesión |
| `GET` | `/usuarios/me` | Sí | Mi perfil |
| `PUT` | `/usuarios/me` | Sí | Editar perfil |
| `GET` | `/usuarios/{id}` | Sí | Perfil de otro usuario |
| `POST` | `/social/seguir/{id}` | Sí | Seguir usuario |
| `DELETE` | `/social/seguir/{id}` | Sí | Dejar de seguir |
| `GET` | `/social/seguidores/{id}` | Sí | Seguidores |
| `GET` | `/social/seguidos/{id}` | Sí | Seguidos |
| `GET` | `/social/sugerencias` | Sí | Sugerencias |
| `POST` | `/posts` | Sí | Crear publicación |
| `GET` | `/posts/{id}` | Sí | Detalle de publicación |
| `GET` | `/feed` | Sí | Feed personalizado |
| `POST` | `/posts/{id}/reaccion` | Sí | Reaccionar |
| `DELETE` | `/posts/{id}/reaccion` | Sí | Quitar reacción |
| `POST` | `/chat/conversaciones` | Sí | Iniciar conversación |
| `GET` | `/chat/conversaciones` | Sí | Mis conversaciones |
| `GET` | `/chat/conversaciones/{id}/mensajes` | Sí | Historial |
| `GET` | `/push/clave-publica` | No | Clave VAPID |
| `POST` | `/push/suscripcion` | Sí | Registrar suscripción |
| `DELETE` | `/push/suscripcion` | Sí | Cancelar suscripción |

---

## 13. Modelo del grafo

```text
(:Usuario {id, nombre, email, passwordHash, bio, creadoEn})
(:Post {id, texto, fecha, mediaKey})
(:Conversacion {id, creadaEn})
(:Mensaje {id, texto, fecha})
(:Suscripcion {endpoint, p256dh, auth})

(:Usuario)-[:SIGUE {desde}]->(:Usuario)
(:Usuario)-[:PUBLICA]->(:Post)
(:Usuario)-[:REACCIONA {tipo, fecha}]->(:Post)
(:Usuario)-[:PARTICIPA_EN]->(:Conversacion)
(:Conversacion)-[:CONTIENE]->(:Mensaje)
(:Usuario)-[:ENVIO]->(:Mensaje)
(:Usuario)-[:TIENE_SUSCRIPCION]->(:Suscripcion)
```

---

## 14. Flujo de trabajo en Git

```powershell
git checkout main
git pull
git checkout -b feature/mi-funcionalidad
# ... trabajar ...
git add <archivos>
git commit -m "feat(area): descripción"
git push -u origin feature/mi-funcionalidad
```

Luego abrir Pull Request en GitHub.

**Reglas:**
- Nunca hacer push directo a `main`
- Prefijos: `feat`, `fix`, `chore`, `docs`, `refactor`
- Nunca subir `.env`, `.pem` ni llaves VAPID

---

## 15. Solución de problemas

| Problema | Solución |
|---|---|
| Docker no funciona | Abre Docker Desktop |
| `docker compose up` falla | Verifica que `.env` existe |
| Error de autenticación Neo4j | `docker compose down -v` y volver a levantar |
| Puerto ocupado | `netstat -ano \| findstr :8080` para identificar |
| Backend no inicia | Verifica que `jwt-keys` terminó con `exited (0)` |

Para más detalles sobre Docker, ver [README-DOCKER.md](README-DOCKER.md).

---

## 16. Decisiones técnicas

- **REST para CRUD y consultas** - Petición-respuesta sin estado, ideal para React
- **Neo4j para relaciones sociales** - Recorridos de grafo más eficientes que JOIN encadenados
- **JWT firmado con RSA** - Stateless, el token lleva el id del usuario
- **Bcrypt para contraseñas** - Solo se guarda el hash, empieza con `$2a$`
- **RustFS en lugar de MinIO** - MinIO fue archivado en 2026, RustFS es compatible S3
- **Web Push con VAPID** - Notificaciones funcionan con la app cerrada
- **Docker Compose** - Entorno reproducible sin instalar dependencias
