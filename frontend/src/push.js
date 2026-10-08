import { api } from './api/client';

function urlBase64ToUint8Array(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = atob(b64);
  return Uint8Array.from([...crudo].map((c) => c.charCodeAt(0)));
}

const soportado = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// ¿La suscripción que ya tiene el navegador se creó con la llave VAPID actual del servidor?
function mismaLlave(suscripcion, llave) {
  const actual = suscripcion.options?.applicationServerKey;
  if (!actual) return false;
  const bytes = new Uint8Array(actual);
  return bytes.length === llave.length && bytes.every((b, i) => b === llave[i]);
}

// Registra el Service Worker, crea (o reutiliza) la suscripción y la guarda en el backend
async function suscribir() {
  await navigator.serviceWorker.register('/sw.js');
  // subscribe() falla si el Service Worker aún se está instalando: hay que esperar a que esté activo
  const registro = await navigator.serviceWorker.ready;

  const { clave } = await api('/push/clave-publica');
  const llave = urlBase64ToUint8Array(clave);

  let suscripcion = await registro.pushManager.getSubscription();
  if (suscripcion && !mismaLlave(suscripcion, llave)) {
    // El servidor cambió de llave VAPID: la suscripción vieja ya no sirve y bloquea la nueva
    await suscripcion.unsubscribe();
    suscripcion = null;
  }
  if (!suscripcion) {
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: llave,
    });
  }

  await api('/push/suscripcion', { metodo: 'POST', cuerpo: suscripcion.toJSON() });
}

// Botón "Notificaciones": pide el permiso al usuario (debe llamarse desde un clic)
export async function activarNotificaciones() {
  if (!soportado()) return false;

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return false;
    await suscribir();
    return true;
  } catch (error) {
    console.error('Error activando notificaciones:', error);
    return false;
  }
}

// Al iniciar sesión: si el permiso ya estaba concedido, asocia la suscripción al usuario actual sin preguntar
export async function sincronizarNotificaciones() {
  if (!soportado() || Notification.permission !== 'granted') return;

  try {
    await suscribir();
  } catch (error) {
    console.warn('No se pudo sincronizar la suscripción push:', error);
  }
}

// Al cerrar sesión: el backend deja de enviar a este navegador los avisos de la cuenta que sale
export async function desvincularNotificaciones() {
  if (!soportado()) return;

  try {
    const registro = await navigator.serviceWorker.getRegistration();
    const suscripcion = await registro?.pushManager.getSubscription();
    if (suscripcion) {
      await api(`/push/suscripcion?endpoint=${encodeURIComponent(suscripcion.endpoint)}`, { metodo: 'DELETE' });
    }
  } catch (error) {
    console.warn('No se pudo desvincular la suscripción push:', error);
  }
}
