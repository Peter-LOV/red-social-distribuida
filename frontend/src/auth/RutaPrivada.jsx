import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RutaPrivada({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
