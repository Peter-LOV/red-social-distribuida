self.addEventListener('push', (event) => {
  let datos = {};

  if (event.data) {
    try {
      datos = event.data.json();
    } catch (e) {
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
  const urlDestino = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si la ventana ya existe, enfocarla y navegar
      for (const v of ventanas) {
        if ('focus' in v) {
          v.navigate(urlDestino);
          return v.focus();
        }
      }
      // Si la app está cerrada, abrir una ventana nueva
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    })
  );
});