// ─── Custom Service Worker — Quiniela Mundial 2026 ───────────────

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Quiniela 2026', body: event.data.text() };
  }

  const title = data.title || 'Quiniela Mundial 2026';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon.svg',
    badge: data.badge || '/icons/icon.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'quiniela-resultado',      // reemplaza notif anterior del mismo tag
    renotify: true,                              // vibrar incluso si el tag ya existe
    requireInteraction: false,                   // no persistir indefinidamente
    data: {
      url: (data.data && data.data.url) ? data.data.url : '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Buscar una ventana ya abierta con nuestra URL y enfocarla
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // Navegar al url correcto y enfocar
        if ('navigate' in client) {
          client.navigate(urlToOpen);
        }
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ninguna ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
