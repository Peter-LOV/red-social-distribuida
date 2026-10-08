import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { desvincularNotificaciones, sincronizarNotificaciones } from '../push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // true = hay sesión guardada pero el servidor no respondió al comprobarla
  const [sinConexion, setSinConexion] = useState(false);

  const cargarSesion = useCallback(() => {
    if (!localStorage.getItem('token')) {
      setCargando(false);
      return;
    }
    setCargando(true);
    api('/usuarios/me')
      .then((u) => {
        setUsuario(u);
        setSinConexion(false);
        sincronizarNotificaciones();
      })
      .catch(() => {
        // Con token inválido (401) api() ya lo borró y redirige al login.
        // Si el token sigue ahí, el fallo es del servidor o de la red: la sesión se conserva.
        setSinConexion(Boolean(localStorage.getItem('token')));
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

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
    sincronizarNotificaciones();
    return data;
  };

  const logout = async () => {
    // Mientras el token todavía sirve: este navegador deja de recibir los avisos de esta cuenta
    await desvincularNotificaciones();
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, registro, logout, cargando, sinConexion, reintentar: cargarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
