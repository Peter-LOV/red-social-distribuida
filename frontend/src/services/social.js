// Llamadas a la API del grafo social
import { api } from '../api/client';

export const obtenerSugerencias = () => api('/social/sugerencias');
export const obtenerSeguidores = (id) => api(`/social/seguidores/${id}`);
export const obtenerSeguidos = (id) => api(`/social/seguidos/${id}`);
export const seguir = (id) => api(`/social/seguir/${id}`, { metodo: 'POST' });
export const dejarDeSeguir = (id) => api(`/social/seguir/${id}`, { metodo: 'DELETE' });