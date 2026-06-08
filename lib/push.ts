import { apiFetch, getToken } from './api';

/**
 * Convierte una clave VAPID Base64URL a Uint8Array requerido por el navegador
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Solicita permiso al navegador y registra la suscripción push en el backend.
 * Llamar SOLO después de que el usuario haga click en "Activar notificaciones".
 */
export async function inicializarPush() {
  if (typeof window === 'undefined') return;

  // Verificar soporte del navegador
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.warn('⚠️ Push notifications no soportadas en este navegador.');
    return;
  }

  // Verificar que el usuario esté autenticado
  if (!getToken()) return;

  // Solicitar permiso del navegador (solo si aún no fue decidido)
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    console.warn('⚠️ Permiso de notificaciones denegado.');
    return;
  }

  try {
    // Esperar a que el service worker esté activo
    const registration = await navigator.serviceWorker.ready;

    // Obtener clave pública VAPID desde el backend
    const { publicKey } = await apiFetch<{ publicKey: string }>('/api/notifications/vapid-key');
    if (!publicKey || publicKey === 'YOUR_PUBLIC_KEY') {
      console.warn('⚠️ VAPID key pública no configurada en el servidor.');
      return;
    }

    // Verificar si ya hay una suscripción activa
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log('🚀 Nueva suscripción Push registrada');
    }

    // Sincronizar suscripción con el backend (igual que toqui.app: enviar endpoint + keys + userAgent)
    const subJson = subscription.toJSON();
    await apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
        },
        userAgent: navigator.userAgent,
      }),
    });

    console.log('✅ Suscripción Push sincronizada con el servidor');
  } catch (error: any) {
    console.error('❌ Error al inicializar notificaciones push:', error.message || error);
  }
}

/**
 * Registra silenciosamente la suscripción push si el permiso ya fue concedido.
 * Llamar en cada carga de página para mantener la suscripción activa.
 */
export async function sincronizarPushSilencioso() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!getToken()) return;
  if (Notification.permission !== 'granted') return;

  // Ejecutar sin bloquear el render
  setTimeout(async () => {
    try {
      await inicializarPush();
    } catch {
      // Fallo silencioso — no interrumpir la app
    }
  }, 0);
}
