import { api } from './api/client';

function urlBase64ToUint8Array(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = atob(b64);
  return Uint8Array.from([...crudo].map((c) => c.charCodeAt(0)));
}

export async function activarNotificaciones() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const registro = await navigator.serviceWorker.register('/sw.js');
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return false;

    const { clave } = await api('/push/clave-publica');
    const suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(clave),
    });

    await api('/push/suscripcion', { metodo: 'POST', cuerpo: suscripcion.toJSON() });
    return true;
  } catch (error) {
    console.error('Error activando notificaciones:', error);
    return false;
  }
}
