// Tomar el control de las pestañas abiertas en cuanto se instala o actualiza el Service Worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let datos = {};

  if (event.data) {
    try {
      datos = event.data.json();
    } catch {
      // Si el backend o las herramientas de Chrome mandan texto plano en lugar de JSON
      datos = {
        titulo: 'Nueva publicación',
        cuerpo: event.data.text() || 'Tienes novedades en Synapse',
        url: '/'
      };
    }
  }

  const titulo = datos.titulo || 'Nueva publicación en Synapse';
  const opciones = {
    body: datos.cuerpo || 'Un usuario que sigues ha publicado algo nuevo.',
    icon: '/logo.svg',
    badge: '/favicon.svg',
    tag: 'synapse-post-' + (datos.url || Date.now()),
    renotify: true,
    data: {
      url: datos.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(titulo, opciones)
  );
});

// Al hacer clic sobre el banner de Windows/Chrome, enfocar la app y navegar al post
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const ventanas = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const ventana of ventanas) {
        try {
          // navigate() falla si este Service Worker todavía no controla la pestaña
          const actual = ventana.url === destino ? ventana : await ventana.navigate(destino);
          await (actual || ventana).focus();
          return;
        } catch {
          // se intenta con la siguiente pestaña o se abre una nueva
        }
      }

      // Si la app está cerrada (o no se pudo reutilizar ninguna pestaña), abrir una ventana nueva
      await clients.openWindow(destino);
    })()
  );
});
