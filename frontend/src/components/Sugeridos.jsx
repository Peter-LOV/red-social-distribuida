import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { mensajeAmigable } from '../services/posts';
import { obtenerSugerencias, seguir } from '../services/social';
import '../styles/posts.css';
import '../styles/feed.css';

function textoVia(via = [], enComun = 0) {
  if (via.length === 0) return `${enComun} en común`;
  if (via.length === 1) return `Lo sigue ${via[0]}`;
  return `Lo siguen ${via.slice(0, -1).join(', ')} y ${via[via.length - 1]}`;
}

// Tarjeta lateral "Personas que quizá conozcas": usa GET /social/sugerencias
export function Sugeridos({ onSeguido, onMensaje }) {
  const [lista, setLista] = useState(null);
  const [siguiendo, setSiguiendo] = useState({});

  useEffect(() => {
    let activo = true;
    obtenerSugerencias()
      .then((d) => activo && setLista(d.slice(0, 5)))
      .catch(() => activo && setLista([]));
    return () => {
      activo = false;
    };
  }, []);

  const alSeguir = async (p) => {
    setSiguiendo((s) => ({ ...s, [p.id]: 'cargando' }));
    try {
      await seguir(p.id);
      setSiguiendo((s) => ({ ...s, [p.id]: 'listo' }));
      onMensaje(`Ahora sigues a ${p.nombre}.`, 'ok');
      onSeguido?.();
    } catch (err) {
      setSiguiendo((s) => ({ ...s, [p.id]: undefined }));
      onMensaje(mensajeAmigable(err, 'No pudimos seguir a esta persona. Intenta nuevamente.'), 'error');
    }
  };

  return (
    <aside className="rs-lateral">
      <section className="rs-tarjeta rs-sug">
        <h2>Personas que quizá conozcas</h2>
        {lista === null && <p className="rs-sug-nota">{'Buscando personas\u2026'}</p>}
        {lista?.length === 0 && (
          <p className="rs-sug-nota">Cuando sigas a alguien, aquí te sugeriremos personas conectadas con tu red.</p>
        )}
        {lista?.map((p) => (
          <div key={p.id} className="rs-sug-fila">
            <Avatar nombre={p.nombre} tamano={40} />
            <div className="rs-sug-info">
              <div className="rs-sug-nombre">{p.nombre}</div>
              <div className="rs-sug-via">{textoVia(p.via, p.enComun)}</div>
            </div>
            <button
              type="button"
              className={`rs-boton rs-boton--chico ${siguiendo[p.id] === 'listo' ? 'rs-boton--hecho' : 'rs-boton--primario'}`}
              disabled={Boolean(siguiendo[p.id])}
              onClick={() => alSeguir(p)}
            >
              {siguiendo[p.id] === 'listo' ? 'Siguiendo' : siguiendo[p.id] === 'cargando' ? '\u2026' : 'Seguir'}
            </button>
          </div>
        ))}
      </section>
      <section className="rs-tarjeta rs-atajos">
        <Link to="/grafo" className="rs-boton rs-boton--fantasma">Ver el grafo de mi red</Link>
        <Link to="/chat" className="rs-boton rs-boton--fantasma">Abrir mis mensajes</Link>
      </section>
    </aside>
  );
}