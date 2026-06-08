// ─── Custom Service Worker — Push Notifications ──────────────────

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Quiniela Mundial 2026 🏆';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon.svg',
      badge: data.badge || '/icons/icon.svg',
      data: {
        url: data.data?.url || '/dashboard',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error parsing push event data:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Si ya hay una ventana abierta en el sitio, redirigirla y enfocarla
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          // Si el navegador soporta focus, enfocamos
          return client.focus();
        }
      }
      // Si no, abrir una nueva pestaña
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
