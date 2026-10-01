import { iniciales } from '../utils/formato';

const COLORES = ['#2563eb', '#7c3aed', '#0d9488', '#db2777', '#ea580c', '#4f46e5'];

function colorDe(nombre = '') {
  let hash = 0;
  for (const letra of nombre) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return COLORES[hash % COLORES.length];
}

// El backend no guarda foto de perfil: se muestran las iniciales con un color estable por nombre
export function Avatar({ nombre, tamano = 44 }) {
  return (
    <span
      className="rs-avatar"
      aria-hidden="true"
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.38, background: colorDe(nombre) }}
    >
      {iniciales(nombre)}
    </span>
  );
}