import { useCallback, useState } from 'react';

// Avisos breves ("toasts"). tipo: 'ok' | 'error' | 'aviso'
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const mostrar = useCallback((mensaje, tipo = 'ok') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((lista) => [...lista, { id, mensaje, tipo }]);
    setTimeout(() => setToasts((lista) => lista.filter((t) => t.id !== id)), 3500);
  }, []);

  return { toasts, mostrar };
}