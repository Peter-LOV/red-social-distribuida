// Llamadas a la API de publicaciones, feed, reacciones e imágenes
import { api, API } from '../api/client';

export const MAX_TEXTO = 500;
export const MAX_IMAGEN_MB = 10;
export const POR_PAGINA = 20;
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const obtenerFeed = (pagina = 0) => api(`/feed?pagina=${pagina}`);

export const obtenerPost = (id) => api(`/posts/${id}`);

export function crearPost(texto, imagen) {
  const formData = new FormData();
  formData.append('texto', texto);
  if (imagen) formData.append('imagen', imagen);
  return api('/posts', { metodo: 'POST', formData });
}

export const reaccionar = (id, tipo = 'LIKE') =>
  api(`/posts/${id}/reaccion`, { metodo: 'POST', cuerpo: { tipo } });

export const quitarReaccion = (id) => api(`/posts/${id}/reaccion`, { metodo: 'DELETE' });

export const urlImagen = (clave) => (clave ? `${API}/media/${clave}` : null);

// Convierte errores técnicos en mensajes comprensibles para el usuario
export function mensajeAmigable(err, porDefecto) {
  if (err instanceof TypeError) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  }
  if (!err?.message || /^Error \d+/.test(err.message)) return porDefecto;
  return err.message;
}