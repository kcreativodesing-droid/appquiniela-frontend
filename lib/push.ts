import { apiFetch, getToken } from './api';

/**
 * Convierte una clave VAPID Base64URL a Uint8Array requerido por el navegador
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Inicializa y registra la suscripción de notificaciones push para el usuario actual.
 */
export async function inicializarPush() {
  if (typeof window === 'undefined') return;

  // 1. Verificar soporte
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Las notificaciones push no están soportadas en este navegador.');
    return;
  }

  // 2. Verificar que el usuario esté logueado
  if (!getToken()) {
    return;
  }

  try {
    // Esperar a que el service worker esté listo
    const registration = await navigator.serviceWorker.ready;

    // 3. Obtener la clave pública VAPID desde el backend
    const { publicKey } = await apiFetch<{ publicKey: string }>('/api/notifications/vapid-key');
    if (!publicKey) {
      console.warn('⚠️ Clave pública VAPID no configurada en el servidor.');
      return;
    }

    // 4. Solicitar permiso de notificaciones si no se ha otorgado
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('⚠️ Permiso de notificaciones denegado por el usuario.');
      return;
    }

    // 5. Comprobar si ya existe una suscripción activa
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Registrar nueva suscripción
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      };

      subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('🚀 Nueva suscripción Push generada con éxito');
    }

    // Enviar/Actualizar suscripción en el backend
    await apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });

    console.log('✅ Suscripción Push sincronizada con el servidor');
  } catch (error: any) {
    console.error('❌ Error al inicializar notificaciones push:', error.message || error);
  }
}
