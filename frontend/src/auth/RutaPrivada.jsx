import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../styles/posts.css';

export function RutaPrivada({ children }) {
  const { usuario, cargando, sinConexion, reintentar } = useAuth();

  if (cargando) {
    return (
      <main className="rs-contenedor">
        <p className="rs-sug-nota" role="status">Cargando…</p>
      </main>
    );
  }

  // Hay una sesión guardada, pero el servidor no respondió: no se expulsa al usuario
  if (!usuario && sinConexion) {
    return (
      <main className="rs-contenedor">
        <div className="rs-tarjeta rs-vacio rs-vacio--error" role="alert">
          <div className="rs-vacio-icono" aria-hidden="true">!</div>
          <h2>No pudimos conectar con el servidor</h2>
          <p>Tu sesión sigue guardada. Revisa tu conexión o espera unos segundos e intenta de nuevo.</p>
          <button type="button" className="rs-boton rs-boton--primario" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
