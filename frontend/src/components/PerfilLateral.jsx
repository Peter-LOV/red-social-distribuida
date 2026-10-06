import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { obtenerSeguidores, obtenerSeguidos } from '../services/social';
import '../styles/posts.css';
import '../styles/feed.css';

const comoLista = (d) => (Array.isArray(d) ? d : []);

// Columna izquierda: mi perfil con contadores reales y las personas que sigo
export function PerfilLateral() {
  const { usuario } = useAuth();
  const [seguidores, setSeguidores] = useState(null);
  const [seguidos, setSeguidos] = useState(null);

  useEffect(() => {
    if (!usuario?.id) return undefined;
    let activo = true;
    obtenerSeguidores(usuario.id)
      .then((d) => activo && setSeguidores(comoLista(d)))
      .catch(() => activo && setSeguidores([]));
    obtenerSeguidos(usuario.id)
      .then((d) => activo && setSeguidos(comoLista(d)))
      .catch(() => activo && setSeguidos([]));
    return () => {
      activo = false;
    };
  }, [usuario?.id]);

  return (
    <aside className="rs-lateral rs-izquierda">
      <section className="rs-tarjeta rs-perfil">
        <Avatar nombre={usuario?.nombre} tamano={72} />
        <h2>{usuario?.nombre}</h2>
        <div className="rs-stats">
          <div>
            <strong>{seguidores ? seguidores.length : '\u2026'}</strong>
            <span>Seguidores</span>
          </div>
          <div>
            <strong>{seguidos ? seguidos.length : '\u2026'}</strong>
            <span>Siguiendo</span>
          </div>
        </div>
        <Link to={`/perfil/${usuario?.id}`} className="rs-boton rs-boton--fantasma rs-boton--chico">
          Ver mi perfil
        </Link>
      </section>
      <section className="rs-tarjeta rs-sug">
        <h2>Tu red</h2>
        {seguidos?.length === 0 && (
          <p className="rs-sug-nota">Aún no sigues a nadie. Empieza con las sugerencias.</p>
        )}
        {seguidos?.slice(0, 6).map((p) => (
          <Link key={p.id} to={`/perfil/${p.id}`} className="rs-sug-fila" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar nombre={p.nombre} tamano={34} />
            <div className="rs-sug-nombre">{p.nombre}</div>
          </Link>
        ))}
      </section>
    </aside>
  );
}
