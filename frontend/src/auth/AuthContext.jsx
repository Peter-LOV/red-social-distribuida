import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api('/usuarios/me')
        .then(setUsuario)
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

  const logout = () => {
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
