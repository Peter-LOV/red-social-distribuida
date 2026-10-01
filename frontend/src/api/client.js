export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function api(ruta, { metodo = 'GET', cuerpo, formData } = {}) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (formData) {
    body = formData;
  } else if (cuerpo) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  const res = await fetch(`${API}${ruta}`, { method: metodo, headers, body });

  if (res.status === 401 && token) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const datos = await res.json().catch(() => ({}));
    throw new Error(datos.error ?? `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}
