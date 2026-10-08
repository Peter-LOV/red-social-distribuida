// Llamadas a la API del grafo social
import { api } from '../api/client';

export const obtenerSugerencias = () => api('/social/sugerencias');
export const obtenerSeguidores = (id) => api(`/social/seguidores/${id}`);
export const obtenerSeguidos = (id) => api(`/social/seguidos/${id}`);
export const seguir = (id) => api(`/social/seguir/${id}`, { metodo: 'POST' });
export const dejarDeSeguir = (id) => api(`/social/seguir/${id}`, { metodo: 'DELETE' });
export const obtenerEstado = (id) => api(`/social/estado/${id}`);
export const obtenerEnComun = (id) => api(`/social/en-comun/${id}`);
export const obtenerAlcanzables = () => api('/social/alcanzables');
export const obtenerGrafo = () => api('/social/grafo');
export const obtenerUsuario = (id) => api(`/usuarios/${id}`);
export const buscarUsuarios = (texto) => api(`/usuarios?buscar=${encodeURIComponent(texto)}`);
export const actualizarPerfil = (nombre, bio) =>
  api('/usuarios/me', { metodo: 'PUT', cuerpo: { nombre, bio } });