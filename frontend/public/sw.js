self.addEventListener('push', (event) => {
  const datos = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(datos.titulo || 'Nueva publicación', {
      body: datos.cuerpo || '',
      data: { url: datos.url || '/' },
    })
  );
});

// Al hacer clic, abre la aplicación en el recurso correspondiente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) { v.navigate(url); return v.focus(); }
      }
      return clients.openWindow(url);
    })
  );
});
