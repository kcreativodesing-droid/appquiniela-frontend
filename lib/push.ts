import { apiFetch, getToken } from './api';

/**
 * Convierte una clave VAPID Base64URL a Uint8Array requerido por el navegador
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Obtiene o espera el registro del Service Worker con timeout.
 * navigator.serviceWorker.ready puede colgarse indefinidamente — añadimos un límite.
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  // Intentar registrar el SW manualmente si no está registrado aún
  const registrations = await navigator.serviceWorker.getRegistrations();

  if (registrations.length === 0) {
    // Forzar registro del SW de next-pwa
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Dar tiempo a que se instale
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return reg;
  }

  // Usar el primer registro activo que encontremos
  const active = registrations.find((r) => r.active || r.installing || r.waiting);
  if (active) return active;

  // Como último recurso: esperar ready con timeout de 5 segundos
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Service Worker no respondió en 5 segundos')), 5000)
    ),
  ]) as Promise<ServiceWorkerRegistration>;
}

/**
 * Solicita permiso y registra la suscripción push en el backend.
 * Llamar SOLO cuando el usuario hace click en "Activar notificaciones".
 */
export async function inicializarPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Verificar soporte básico
  if (!('serviceWorker' in navigator)) {
    throw new Error('Tu navegador no soporta Service Workers.');
  }
  if (!('PushManager' in window)) {
    throw new Error('Tu navegador no soporta notificaciones push.');
  }
  if (!('Notification' in window)) {
    throw new Error('Tu navegador no soporta notificaciones.');
  }

  // 2. Verificar autenticación
  if (!getToken()) {
    throw new Error('Debes iniciar sesión para activar notificaciones.');
  }

  // 3. Solicitar permiso nativo del navegador
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission === 'denied') {
    throw new Error('Permiso de notificaciones denegado. Ve a Configuración del navegador para activarlas.');
  }
  if (permission !== 'granted') {
    throw new Error('No se otorgó permiso para notificaciones.');
  }

  // 4. Obtener la VAPID public key del backend
  let publicKey: string;
  try {
    const response = await apiFetch<{ publicKey: string }>('/api/notifications/vapid-key');
    publicKey = response.publicKey;
  } catch (err: any) {
    throw new Error(`No se pudo conectar con el servidor: ${err.message}`);
  }

  if (!publicKey || publicKey === 'YOUR_PUBLIC_KEY' || publicKey.length < 10) {
    throw new Error('El servidor no tiene las notificaciones configuradas aún.');
  }

  // 5. Obtener el registro del Service Worker (con timeout y fallback)
  let registration: ServiceWorkerRegistration;
  try {
    registration = await getServiceWorkerRegistration();
  } catch (err: any) {
    throw new Error(`Service Worker no disponible: ${err.message}`);
  }

  // 6. Verificar si ya hay suscripción activa
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Crear nueva suscripción
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('El navegador bloqueó la suscripción. Verifica los permisos.');
      }
      throw new Error(`Error al suscribirse: ${err.message}`);
    }
  }

  // 7. Enviar suscripción al backend
  const subJson = subscription.toJSON();
  try {
    await apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh ?? '',
          auth: subJson.keys?.auth ?? '',
        },
        userAgent: navigator.userAgent,
      }),
    });
  } catch (err: any) {
    // La suscripción existe en el navegador aunque falle sincronizarla
    console.warn('⚠️ Suscripción creada localmente pero no sincronizada:', err.message);
  }

  console.log('✅ Notificaciones push activadas correctamente');
  return true;
}

/**
 * Sincroniza silenciosamente en segundo plano si el permiso ya fue otorgado.
 */
export async function sincronizarPushSilencioso() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!getToken()) return;
  if (Notification.permission !== 'granted') return;

  // No bloquear el render — ejecutar en el próximo tick
  setTimeout(async () => {
    try {
      await inicializarPush();
    } catch {
      // Fallo silencioso
    }
  }, 100);
}
