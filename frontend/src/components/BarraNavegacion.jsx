import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { activarNotificaciones } from '../push';

export function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleActivarNotificaciones = async () => {
    const exito = await activarNotificaciones();
    if (exito) {
      alert('Notificaciones activadas correctamente');
    } else {
      alert('No se pudieron activar las notificaciones. Verifica que tu navegador las soporte.');
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Red Social
        </Link>
        {usuario && (
          <div style={styles.links}>
            <Link to="/" style={styles.link}>Feed</Link>
            <Link to="/chat" style={styles.link}>Chat</Link>
            <Link to="/sugerencias" style={styles.link}>Sugerencias</Link>
            <Link to="/grafo" style={styles.link}>Grafo</Link>
            <button onClick={handleActivarNotificaciones} style={styles.button}>
              Activar notificaciones
            </button>
            <span style={styles.usuario}>{usuario.nombre}</span>
            <button onClick={handleLogout} style={styles.button}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#2563eb',
    padding: '1rem 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
  },
  usuario: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
