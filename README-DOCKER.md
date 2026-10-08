# Guía de Docker - Red Social Distribuida

Esta guía explica cómo levantar la aplicación completa usando Docker Compose. Es la forma recomendada para probar el proyecto sin instalar nada más que Docker Desktop.

---

## Requisitos previos

Solo necesitas **Docker Desktop** instalado y corriendo:

1. Descarga Docker Desktop desde https://www.docker.com/products/docker-desktop
2. Instálalo y ábrelo (debe aparecer el ícono de la ballena en la barra de tareas)
3. Verifica que funciona:
   ```powershell
   docker --version
   docker compose version
   ```

No necesitas instalar Java, Node.js, Maven, Neo4j ni nada más. Docker se encarga de todo.

---

## Paso 1: Clonar el repositorio

```powershell
git clone https://github.com/Peter-LOV/red-social-distribuida.git
cd red-social-distribuida
```

---

## Paso 2: Configurar las credenciales

Copia el archivo de ejemplo y edítalo:

```powershell
Copy-Item .env.example .env
notepad .env
```

Cambia estos valores (mínimo 8 caracteres, sin comillas ni espacios):

```env
NEO4J_PASSWORD=TuClaveNeo4j2026
S3_ACCESS_KEY=tuusuarios3
S3_SECRET_KEY=TuClaveSecretaLarga
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@redsocial.local
```

### Sobre las llaves VAPID (notificaciones):

Tienes dos opciones:

**Opción A - Desarrollo individual (recomendado):**
Genera tus propias llaves:
```powershell
npx web-push generate-vapid-keys
```
Copia la `Public Key` y `Private Key` en el `.env`.

**Opción B - Compartir llaves del equipo:**
Si el equipo ya acordó un par de llaves VAPID, úsalas las mismas (compártelas por un canal privado como WhatsApp o email).

---

## Paso 3: Levantar todo con Docker

```powershell
docker compose up -d --build
```

**¿Qué hace este comando?**
- Descarga las imágenes de Docker (primera vez, tarda 5-10 minutos)
- Construye el backend y frontend (tarda 3-5 minutos)
- Genera automáticamente las llaves JWT
- Levanta todos los servicios en el orden correcto

**Tiempo estimado:** 10-15 minutos la primera vez.

---

## Paso 4: Verificar que todo esté corriendo

```powershell
docker compose ps
```

Deberías ver esto:

| Servicio | Estado esperado | Descripción |
|----------|----------------|-------------|
| `redsocial-neo4j` | `healthy` | Base de datos de grafos (puede tardar 30s) |
| `redsocial-rustfs` | `running` | Almacenamiento S3 |
| `redsocial-jwt-keys` | `exited (0)` | ✅ Generó llaves JWT y terminó (normal) |
| `redsocial-backend` | `running` | API REST backend |
| `redsocial-frontend` | `running` | Frontend React |

**Importante:** `jwt-keys` con `exited (0)` es correcto. Solo se ejecuta una vez para generar las llaves.

---

## Paso 5: Acceder a la aplicación

### Frontend (usuario final)
👉 http://localhost:80

### Backend API (Swagger)
👉 http://localhost:8080/q/swagger-ui

### Neo4j Browser (para ver el grafo)
👉 http://localhost:7474
- Usuario: `neo4j`
- Contraseña: la que pusiste en `.env`

### Consola de RustFS (para ver archivos)
👉 http://localhost:9001
- Usuario: el `S3_ACCESS_KEY` de tu `.env`
- Contraseña: el `S3_SECRET_KEY` de tu `.env`

---

## Paso 6: Probar el flujo básico

1. **Abre** http://localhost:80
2. **Regístrate** con un email y contraseña
3. **Inicia sesión**
4. **Crea un post** en el feed
5. **Verifica** que el post aparece

---

## Comandos útiles

### Ver logs en tiempo real

```powershell
# Ver todos los logs
docker compose logs -f

# Ver solo logs del backend
docker compose logs -f backend

# Ver solo logs del frontend
docker compose logs -f frontend
```

### Detener la aplicación

```powershell
docker compose down
```

Esto detiene los contenedores pero **conserva los datos** (usuarios, posts, archivos).

### Empezar de cero (borrar todo)

```powershell
docker compose down -v
```

⚠️ **Advertencia:** Esto borra todos los datos (usuarios, posts, archivos). Úsalo solo si quieres empezar completamente de cero.

### Reconstruir un solo servicio

Si solo modificaste el código del backend:

```powershell
docker compose up -d --build backend
```

Si solo modificaste el frontend:

```powershell
docker compose up -d --build frontend
```

---

## Solución de problemas

### "docker compose not found"

**Causa:** Docker Desktop no está instalado o no está en el PATH.

**Solución:**
1. Instala Docker Desktop desde https://www.docker.com/products/docker-desktop
2. Reinicia tu terminal
3. Verifica con `docker --version`

### "Permission denied" al crear `.env`

**Causa:** Permisos de Windows.

**Solución:**
- Ejecuta PowerShell como administrador
- O usa Git Bash en lugar de PowerShell

### Neo4j no pasa a "healthy"

**Causa:** Neo4j tarda en iniciar (normal, puede tardar 30-60 segundos).

**Solución:**
- Espera 60 segundos
- Ejecuta `docker compose ps` nuevamente
- Si sigue sin estar healthy, verifica que no haya error en los logs: `docker compose logs neo4j`

### Backend no inicia

**Causa:** Probablemente `jwt-keys` falló.

**Solución:**
1. Verifica que `jwt-keys` esté en `exited (0)`: `docker compose ps`
2. Si está en `exited (1)`, ve los logs: `docker compose logs jwt-keys`
3. Si falla, borra el volumen y vuelve a intentar:
   ```powershell
   docker compose down -v
   docker compose up -d --build
   ```

### Frontend no carga

**Causa:** El backend no está corriendo o hay error de conexión.

**Solución:**
1. Verifica que el backend esté corriendo: `docker compose ps`
2. Revisa logs del backend: `docker compose logs backend`
3. Accede a http://localhost:8080/q/swagger-ui para verificar que el backend responda

### Error de autenticación en Neo4j

**Causa:** Cambiaste la contraseña en `.env` después de crear el contenedor.

**Solución:**
```powershell
docker compose down -v
docker compose up -d
```

⚠️ Esto borra todos los datos.

### Puerto ya en uso

**Causa:** Ya tienes algo corriendo en ese puerto (80, 8080, 7474, 7687, 9000, 9001).

**Solución:**
1. Identifica qué usa el puerto:
   ```powershell
   netstat -ano | findstr :8080
   ```
2. Detén ese programa o cambia el puerto en `docker-compose.yml`

---

## Arquitectura en Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Frontend   │  │  Backend    │  │  Neo4j      │     │
│  │  (nginx)    │──│  (Quarkus)  │──│  (grafo)    │     │
│  │  :80        │  │  :8080      │  │  :7474/7687 │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                         │                │                │
│                         └────────────────┼────────                │
│                                            │                │
│  ┌─────────────┐  ┌─────────────┐        │                │
│  │  jwt-keys   │  │  RustFS     │◄───────┘                │
│  │  (one-shot) │  │  (S3)       │                         │
│  └─────────────┘  │  :9000/9001 │                         │
│                   └─────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

**Servicios:**
- **Frontend**: Nginx sirviendo React compilado
- **Backend**: Quarkus con Java 21
- **Neo4j**: Base de datos de grafos
- **RustFS**: Almacenamiento compatible con S3
- **jwt-keys**: Genera llaves JWT (se ejecuta una vez)

**Volúmenes:**
- `jwt_keys`: Comparte llaves JWT entre jwt-keys y backend
- `neo4j_data`: Persiste datos de Neo4j
- `rustfs_data`: Persiste archivos de RustFS

---

## Diferencia con modo desarrollo local

Si eres desarrollador y quieres recarga en caliente (hot reload), usa el modo dev local en lugar de Docker:

```powershell
# Solo infraestructura en Docker
docker compose up -d neo4j rustfs

# Backend en modo dev
cd backend
.\scripts\generate-jwt-keys.ps1
.\mvnw quarkus:dev

# Frontend en modo dev (otra terminal)
cd frontend
npm run dev
```

Docker es ideal para:
- Demostraciones
- Despliegue en producción
- Pruebas de integración
- Entorno reproducible sin instalar dependencias

---

## Soporte

Si encuentras un problema no documentado aquí:

1. Revisa los logs: `docker compose logs`
2. Verifica que Docker Desktop esté corriendo
3. Intenta empezar de cero: `docker compose down -v && docker compose up -d --build`
4. Consulta el README principal del proyecto para más detalles
