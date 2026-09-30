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
6. [Puesta en marcha (primera vez)](#6-puesta-en-marcha-primera-vez)
7. [Uso diario](#7-uso-diario)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Puertos usados](#9-puertos-usados)
10. [Estructura del repositorio](#10-estructura-del-repositorio)
11. [API REST (endpoints actuales)](#11-api-rest-endpoints-actuales)
12. [Modelo del grafo](#12-modelo-del-grafo)
13. [Flujo de trabajo en Git](#13-flujo-de-trabajo-en-git)
14. [Solución de problemas](#14-solución-de-problemas)
15. [Decisiones técnicas](#15-decisiones-técnicas)
16. [Secciones pendientes](#16-secciones-pendientes)

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
- [ ] Grafo social: seguir, seguidores, seguidos y sugerencias
- [ ] Publicaciones con imagen en S3
- [ ] Feed personalizado y reacciones
- [ ] Chat en tiempo real (WebSocket)
- [ ] Notificaciones Web Push
- [ ] Frontend React
- [ ] Dockerización completa (backend y frontend en contenedores)

---

## 3. Arquitectura

```text
                     ┌─────────────┐
                     │    React    │   (pendiente)
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
                     Web Push (pendiente)
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

> El diagrama definitivo se guardará en `docs/` y debe reflejar lo realmente implementado.

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

Instala esto **antes** de clonar el proyecto. Cada fila indica cómo comprobar que quedó bien.

| Herramienta | Versión | Cómo comprobarlo | Dónde conseguirlo |
|---|---|---|---|
| **Git for Windows** | cualquiera reciente | `git --version` | https://git-scm.com |
| **Docker Desktop** | cualquiera reciente | `docker --version` y `docker compose version` | https://www.docker.com/products/docker-desktop |
| **JDK 21 (Temurin)** | **21 exactamente** | `java -version` debe decir `21.x` | `winget install EclipseAdoptium.Temurin.21.JDK` |
| **Node.js** | 20 o superior (solo para el frontend) | `node --version` | https://nodejs.org |

Notas importantes:

- **Docker Desktop debe estar abierto y corriendo** (ícono de la ballena en la barra de tareas) antes de ejecutar cualquier comando `docker`.
- **Usa Java 21, no otra versión.** Java 24 y otras versiones intermedias no son LTS y pueden dar errores raros con Quarkus. Si tienes varias versiones instaladas, mira la sección [Solución de problemas](#14-solución-de-problemas).
- Maven **no** hace falta instalarlo: el proyecto incluye `mvnw` (Maven Wrapper) que lo descarga solo.
- `openssl`, necesario para generar las llaves JWT, viene incluido con Git for Windows.
- Los comandos de este documento son para **PowerShell de Windows**.

---

## 6. Puesta en marcha (primera vez)

Sigue los pasos **en orden**. Todos los comandos se ejecutan desde la raíz del repositorio, salvo que se indique otra carpeta.

### Paso 1. Clonar el repositorio

```powershell
git clone https://github.com/USUARIO/red-social-distribuida.git
cd red-social-distribuida
```

> Reemplaza la URL por la del repositorio real.

### Paso 2. Verificar que usas Java 21

```powershell
java -version
```

Si no dice `21.x`, usa este comando (ajusta el nombre de la carpeta a la versión instalada en `C:\Program Files\Eclipse Adoptium\`):

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.1-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

Este cambio solo vale para la terminal actual: hay que repetirlo cada vez que abras una nueva.

### Paso 3. Crear el archivo `.env`

El `.env` guarda las claves de tu entorno y **nunca se sube a Git**. Cada integrante crea el suyo y puede poner valores distintos.

```powershell
Copy-Item .env.example .env
notepad .env
```

Cambia estos valores por los tuyos (**mínimo 8 caracteres, solo letras y números, sin comillas ni espacios**):

```text
NEO4J_PASSWORD=TuClaveNeo4j2026
S3_ACCESS_KEY=tuusuarios3
S3_SECRET_KEY=TuClaveSecretaS3Larga
```

Luego copia el archivo a la carpeta del backend, porque el backend lo lee desde ahí cuando corre en tu PC:

```powershell
Copy-Item .env backend\.env
```

### Paso 4. Levantar Neo4j y el almacenamiento S3

```powershell
docker compose up -d
docker compose ps
```

La primera vez descarga las imágenes y puede tardar unos minutos. Después, `docker compose ps` debe mostrar `redsocial-neo4j` y `redsocial-rustfs` en estado *running* (Neo4j puede tardar 30 segundos en pasar a *healthy*).

Comprueba que responden:

- Neo4j Browser: http://localhost:7474 → usuario `neo4j` y tu `NEO4J_PASSWORD`.
- Consola de almacenamiento: http://localhost:9001 → usuario `S3_ACCESS_KEY` y contraseña `S3_SECRET_KEY`.

### Paso 5. Generar las llaves JWT

El login entrega un token firmado con una llave privada RSA. Cada integrante genera las suyas (están en `.gitignore`):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-jwt-keys.ps1
```

Debe mostrar `Llaves generadas en ...`. Crea `privateKey.pem` y `publicKey.pem` en `backend\src\main\resources`.

### Paso 6. Arrancar el backend

```powershell
cd backend
.\mvnw quarkus:dev
```

- La primera vez descarga dependencias y tarda varios minutos. Es normal.
- Si pregunta por compartir datos anónimos de uso, responde `n`.
- Está listo cuando aparece `Listening on: http://localhost:8080`.
- **Deja esa terminal abierta.** Con `Ctrl+C` se detiene el backend.
- En modo dev, cada cambio que guardes en un archivo Java se recarga solo.

### Paso 7. Probar que todo funciona

1. Abre Swagger UI: http://localhost:8080/q/swagger-ui
2. Ejecuta `POST /auth/registro` con este cuerpo (**Try it out** y luego **Execute**):

   ```json
   {
     "nombre": "Ana",
     "email": "ana@correo.com",
     "password": "clave1234"
   }
   ```

   Debe responder **201** con un `token` y los datos del usuario.
3. Copia el `token` (sin comillas), pulsa **Authorize** (candado), pégalo y confirma.
4. Ejecuta `GET /usuarios/me`: debe devolver tu perfil con código **200**.
5. En Neo4j Browser ejecuta `MATCH (u:Usuario) RETURN u`: debe aparecer tu usuario.

Si los cinco puntos funcionan, tu entorno está listo.

---

## 7. Uso diario

Cuando ya hiciste la puesta en marcha una vez, cada día solo necesitas:

```powershell
# 1. Abrir Docker Desktop y esperar a que inicie

# 2. Traer los cambios del equipo
git checkout main
git pull

# 3. Levantar la infraestructura (desde la raíz)
docker compose up -d

# 4. Arrancar el backend (con Java 21 activo en esa terminal)
cd backend
.\mvnw quarkus:dev
```

Para apagar todo al terminar:

```powershell
# Detener el backend: Ctrl+C en su terminal
docker compose stop        # apaga los contenedores y conserva los datos
```

| Comando | Efecto |
|---|---|
| `docker compose stop` | Apaga los contenedores. Los datos se conservan |
| `docker compose up -d` | Vuelve a encenderlos |
| `docker compose down` | Elimina los contenedores. Los datos se conservan (volúmenes) |
| `docker compose down -v` | Elimina contenedores **y todos los datos** (usuarios, archivos). Úsalo solo para empezar de cero |

---

## 8. Variables de entorno

Se definen en `.env` (raíz) y se copian a `backend/.env`. El archivo `.env.example` es la plantilla.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEO4J_PASSWORD` | Contraseña del usuario de Neo4j. Mínimo 8 caracteres | `TuClaveNeo4j2026` |
| `NEO4J_URI` | Dirección Bolt de Neo4j | `bolt://localhost:7687` |
| `NEO4J_USER` | Usuario de Neo4j | `neo4j` |
| `S3_ACCESS_KEY` | Usuario del almacenamiento S3. Mínimo 8 caracteres | `tuusuarios3` |
| `S3_SECRET_KEY` | Contraseña del almacenamiento S3. Mínimo 8 caracteres | `TuClaveSecretaS3Larga` |
| `S3_BUCKET` | Nombre del bucket para las imágenes de las publicaciones | `posts-media` |
| `S3_ENDPOINT` | Dirección de la API S3 | `http://localhost:9000` |

Reglas para las claves: solo letras y números (evita comillas, espacios y los símbolos `$ # \`), y no uses `neo4j` ni `rustfsadmin` como contraseña.

> Las llaves VAPID de Web Push se agregarán aquí cuando se implemente esa funcionalidad.

---

## 9. Puertos usados

Si alguno está ocupado por otro programa, el servicio no arrancará (ver [Solución de problemas](#14-solución-de-problemas)).

| Puerto | Servicio |
|---|---|
| 8080 | Backend Quarkus y Swagger UI |
| 7474 | Neo4j Browser |
| 7687 | Neo4j (protocolo Bolt, lo usa el backend) |
| 9000 | API S3 (RustFS) |
| 9001 | Consola web de RustFS |
| 5173 | Frontend React en desarrollo (pendiente) |

---

## 10. Estructura del repositorio

```text
red-social-distribuida/
├── backend/                     Proyecto Quarkus (Java 21, Maven)
│   └── src/main/java/com/redsocial/
│       ├── common/              Código compartido (constraints de Neo4j)
│       ├── usuarios/            Registro, login, perfiles y grafo social
│       ├── posts/               Publicaciones, S3, feed y reacciones
│       ├── chat/                Mensajería con WebSocket
│       └── push/                Notificaciones Web Push
├── frontend/                    Aplicación React (pendiente)
├── scripts/                     Scripts de ayuda (llaves JWT)
├── docs/                        Diagrama de arquitectura y documentación
├── docker-compose.yml           Neo4j + almacenamiento S3
├── .env.example                 Plantilla de variables de entorno
└── README.md
```

---

## 11. API REST (endpoints actuales)

La documentación interactiva está en http://localhost:8080/q/swagger-ui cuando el backend corre.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/registro` | No | Crea un usuario y devuelve un token JWT |
| `POST` | `/auth/login` | No | Valida credenciales y devuelve un token JWT |
| `GET` | `/usuarios/me` | Sí | Perfil del usuario autenticado |
| `PUT` | `/usuarios/me` | Sí | Edita nombre y biografía |
| `GET` | `/usuarios/{id}` | Sí | Perfil de cualquier usuario |

Las rutas protegidas exigen la cabecera `Authorization: Bearer <token>`. Sin token, el servidor responde `401`.

Códigos frecuentes: `201` creado, `400` datos inválidos, `401` no autenticado o credenciales inválidas, `404` no encontrado, `409` email ya registrado.

---

## 12. Modelo del grafo

Nodos y relaciones definidos por el equipo. Los marcados con ✅ ya existen en el código; el resto es el diseño acordado.

```text
✅ (:Usuario {id, nombre, email, passwordHash, bio, creadoEn})

   (:Post {id, texto, fecha, mediaKey})
   (:Conversacion {id})
   (:Mensaje {id, texto, fecha})

   (:Usuario)-[:SIGUE {desde}]->(:Usuario)
   (:Usuario)-[:PUBLICA]->(:Post)
   (:Usuario)-[:REACCIONA {tipo, fecha}]->(:Post)
   (:Usuario)-[:PARTICIPA_EN]->(:Conversacion)
   (:Conversacion)-[:CONTIENE]->(:Mensaje)
   (:Usuario)-[:ENVIO]->(:Mensaje)
```

- `mediaKey` es únicamente la clave del objeto en S3. **Las imágenes nunca se guardan en Neo4j.**
- Constraints actuales (se crean solas al arrancar el backend): `Usuario.id` único y `Usuario.email` único.

---

## 13. Flujo de trabajo en Git

- **Nunca se hace push directo a `main`.** Está protegida: todo entra por Pull Request.
- Cada quien trabaja en su propia rama, con nombres como `feature/grafo-social`, `feature/posts-s3`, `feature/chat` o `feature/webpush`.
- Un compañero revisa y aprueba antes de fusionar. Rotación de revisiones: A revisa a B, B a C, C a D, D a A.

```powershell
git checkout main
git pull
git checkout -b feature/mi-funcionalidad

# ...trabajar...

git add <archivos>
git commit -m "feat(area): descripción corta" -m "Descripción más detallada"
git push -u origin feature/mi-funcionalidad
```

Luego se abre el Pull Request en GitHub.

**Prefijos de commit:** `feat` (funcionalidad nueva), `fix` (corrección), `chore` (mantenimiento o configuración), `docs` (documentación), `refactor` (reorganización sin cambiar el comportamiento).

**Reglas de seguridad** (el repositorio es público):

- Nunca subir `.env`, `backend/.env`, archivos `.pem` ni llaves VAPID.
- Antes de cada commit, revisar con `git status` qué se va a subir.
- Si alguien sube un secreto por accidente, hay que cambiarlo de inmediato: borrarlo en un commit posterior **no** lo elimina del historial.

---

## 14. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `java -version` no dice 21 | Hay otra versión de Java antes en el `PATH` | Usar los dos comandos `$env:JAVA_HOME` y `$env:Path` del [Paso 2](#paso-2-verificar-que-usas-java-21) en esa terminal |
| `docker` no se reconoce, o dice que no puede conectar con el daemon | Docker Desktop no está abierto | Abrir Docker Desktop y esperar a que termine de iniciar |
| `docker compose up` falla con "Define NEO4J_PASSWORD..." | Falta el archivo `.env` | Ejecutar `Copy-Item .env.example .env` y editar las claves |
| PowerShell: "la ejecución de scripts está deshabilitada" o "no está firmado digitalmente" | Política de ejecución de PowerShell | Ejecutar el script así: `powershell -ExecutionPolicy Bypass -File .\scripts\generate-jwt-keys.ps1` |
| "No se encontró openssl" al generar llaves | Git for Windows no está instalado o no está en el `PATH` | Instalar Git for Windows, o ejecutar el script desde Git Bash |
| El backend arranca y falla con `Unable to connect to Neo4j` / `ServiceUnavailable` | Neo4j no está corriendo o todavía está iniciando | `docker compose up -d`, esperar ~30 s y revisar con `docker compose ps` |
| El backend falla por `NEO4J_PASSWORD` no definido | Falta `backend/.env` | `Copy-Item .env backend\.env` (desde la raíz) |
| Error de autenticación de Neo4j (`authentication failure`) | Cambiaste la contraseña en `.env` después de crear el contenedor: Neo4j la guarda la primera vez | `docker compose down -v` y luego `docker compose up -d` (**borra los datos**) |
| No puedo entrar a la consola de RustFS (puerto 9001) | Claves con menos de 8 caracteres, o cambiadas después del primer arranque | Usar claves de 8 o más caracteres y ejecutar `docker compose down -v` y `docker compose up -d` |
| Error `publicKey.pem` / `privateKey.pem` no encontrado | No se generaron las llaves | Ejecutar el [Paso 5](#paso-5-generar-las-llaves-jwt) |
| `Port ... is already in use` (7474, 7687, 9000, 9001, 8080) | Otro programa usa ese puerto, o una instancia anterior sigue abierta | Cerrar ese programa o la terminal anterior del backend. Para ver qué usa el puerto: `netstat -ano \| findstr :8080` |
| Swagger responde `401` en `/usuarios/me` | Falta el token | Hacer `POST /auth/login`, copiar el `token` y usar **Authorize** |
| Swagger responde `400` en el registro | Datos inválidos: email mal escrito o contraseña de menos de 6 caracteres | Usar un email válido y una contraseña de 6 o más caracteres |
| Responde `409` al registrarse | Ese email ya existe | Usar otro email o hacer login |
| Texto con caracteres raros (`estÃ¡n`) en la consola | Codificación de la terminal | Es solo visual, no afecta el funcionamiento |
| Neo4j Browser muestra las propiedades en español (`correo electrónico`, `identificación`) | Chrome está traduciendo la página | Desactivar la traducción automática. Los nombres reales son `email` e `id` |
| `Permission denied` al ejecutar `mvnw` (Linux/macOS) | El archivo perdió el permiso de ejecución | `chmod +x backend/mvnw` |

Si nada de esto resuelve el problema, empezar de cero el entorno local suele funcionar:

```powershell
docker compose down -v
docker compose up -d
```

y volver a arrancar el backend (esto borra los datos locales).

---

## 15. Decisiones técnicas

- **REST para las operaciones convencionales.** Es el modelo petición-respuesta sin estado, ideal para CRUD y consultas, y el que mejor se integra con React. Se usa JSON por simplicidad, legibilidad y compatibilidad con el navegador. Serializaciones binarias como Protobuf reducen el tamaño de los mensajes, pero exigen un contrato estricto y herramientas extra que aquí no compensan.
- **Neo4j para las relaciones sociales.** Seguir usuarios, sugerencias y feed son recorridos de relaciones: en un grafo se expresan con `MATCH` sobre patrones, sin los `JOIN` encadenados de un modelo relacional.
- **Consultas Cypher con parámetros** (`$id`, `$email`), nunca concatenando texto, para evitar inyección Cypher.
- **JWT firmado con RSA.** El backend no guarda sesiones (es *stateless*): el token lleva el id del usuario y su firma se verifica con la llave pública. Vigencia de 8 horas.
- **Contraseñas con bcrypt.** Solo se guarda el hash, nunca el texto plano. Se puede ver en Neo4j: empieza con `$2a$`.
- **Almacenamiento S3 con RustFS en lugar de MinIO.** El repositorio oficial de MinIO fue archivado en abril de 2026 y dejó de publicar imágenes Docker. RustFS es compatible con el protocolo S3 y trae consola web. Como el backend usa la API S3 estándar, cambiar de proveedor solo requiere cambiar el endpoint.
- **Constraints de unicidad en Neo4j** (`Usuario.id`, `Usuario.email`): evitan duplicados aunque dos peticiones lleguen al mismo tiempo.
- **Backend en local y contenedores de infraestructura.** Durante el desarrollo, Neo4j y S3 corren en Docker y Quarkus en modo dev en la máquina de cada quien, para recarga en caliente. La entrega final levantará todo con `docker compose up`.

---

## 16. Secciones pendientes

Estas secciones exige la actividad y se completarán conforme avance el proyecto:

- [ ] Explicación del uso de REST frente a WebSocket (petición-respuesta frente a conexión persistente)
- [ ] Explicación del uso de WebSocket en el chat
- [ ] Explicación del uso de Web Push y configuración de llaves VAPID
- [ ] Consultas Cypher desarrolladas (mínimo 5, al menos una de más de un nivel)
- [ ] Endpoints completos del grafo social, posts, feed, chat y notificaciones
- [ ] Diagrama de arquitectura definitivo en `docs/`
- [ ] Instrucciones de ejecución con todo dockerizado