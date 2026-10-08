# Frontend — React + Vite

Interfaz de la red social. La documentación completa está en el [README principal](../README.md).

## Estructura

```text
src/
├── api/client.js      Cliente REST (añade el token JWT) y URL del WebSocket
├── auth/              Sesión (AuthContext) y rutas privadas
├── pages/             Login, Registro, Feed, Post, Perfil, Sugerencias, Grafo, Chat
├── components/        Barra de navegación, tarjetas de publicación, formulario, avatares
├── services/          Llamadas a la API agrupadas por área (posts, social)
└── push.js            Registro del Service Worker y suscripción Web Push
public/sw.js           Service Worker: recibe el evento push y muestra la notificación
```

## Ejecutar

Con Docker, desde la raíz del repositorio: `docker compose up -d --build` → http://localhost

En modo desarrollo (Node.js 20 o superior, con el backend en http://localhost:8080):

```bash
npm ci
npm run dev        # http://localhost:5173
```

La URL del backend se configura con `VITE_API_URL` (ver `.env.example`).

## Comprobaciones

```bash
npm run lint       # oxlint
npm run build      # compilación de producción
```
