import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { desvincularNotificaciones, sincronizarNotificaciones } from '../push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api('/usuarios/me')
        .then((u) => {
          setUsuario(u);
          sincronizarNotificaciones();
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    // Si este navegador ya dio permiso, la suscripción push pasa a ser de quien acaba de entrar
    sincronizarNotificaciones();
    return data;
  };

  const registro = async (nombre, email, password) => {
    const data = await api('/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre, email, password },
    });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  const logout = async () => {
    // Mientras el token todavía sirve: este navegador deja de recibir los avisos de esta cuenta
    await desvincularNotificaciones();
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, registro, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
