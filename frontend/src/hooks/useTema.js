import { useEffect, useState } from 'react';

const CLAVE = 'synapse-tema';

function leerTema() {
  try {
    return localStorage.getItem(CLAVE) || 'oscuro';
  } catch {
    return 'oscuro';
  }
}

// Tema visual 'oscuro' | 'claro': se guarda en el navegador y se aplica en <html data-tema="...">
export function useTema() {
  const [tema, setTema] = useState(leerTema);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      // sin almacenamiento disponible: el tema solo dura esta sesión
    }
  }, [tema]);

  return [tema, () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))];
}