import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Toasts } from '../components/Toasts';
import { useToast } from '../hooks/useToast';
import { mensajeAmigable } from '../services/posts';
import { obtenerSugerencias, seguir, dejarDeSeguir } from '../services/social';
import '../styles/posts.css';
import '../styles/feed.css';
import '../styles/synapse.css';
import '../styles/personas.css';

function textoVia(via = [], enComun = 0) {
  if (via.length === 0) return `${enComun} conexión${enComun === 1 ? '' : 'es'} en común`;
  if (via.length === 1) return `Lo sigue ${via[0]}`;
  return `Lo siguen ${via.slice(0, -1).join(', ')} y ${via[via.length - 1]}`;
}

// Pantalla completa de personas sugeridas (Persona A)
export function Sugerencias() {
  const [lista, setLista] = useState(null);
  const [estado, setEstado] = useState({});
  const [error, setError] = useState('');
  const { toasts, mostrar } = useToast();

  const cargar = () => {
    setError('');
    obtenerSugerencias()
      .then((d) => setLista(Array.isArray(d) ? d : []))
      .catch((err) => {
        setLista([]);
        setError(mensajeAmigable(err, 'No pudimos cargar las sugerencias. Intenta nuevamente.'));
      });
  };

  useEffect(() => {
    cargar();
  }, []);

  const alSeguir = async (p) => {
    setEstado((s) => ({ ...s, [p.id]: 'cargando' }));
    try {
      await seguir(p.id);
      setEstado((s) => ({ ...s, [p.id]: 'siguiendo' }));
      mostrar(`Ahora sigues a ${p.nombre}.`, 'ok');
    } catch (err) {
      setEstado((s) => ({ ...s, [p.id]: undefined }));
      mostrar(mensajeAmigable(err, 'No pudimos seguir a esta persona.'), 'error');
    }
  };

  const alDejar = async (p) => {
    setEstado((s) => ({ ...s, [p.id]: 'cargando' }));
    try {
      await dejarDeSeguir(p.id);
      setEstado((s) => ({ ...s, [p.id]: undefined }));
      mostrar(`Dejaste de seguir a ${p.nombre}.`, 'ok');
    } catch (err) {
      setEstado((s) => ({ ...s, [p.id]: 'siguiendo' }));
      mostrar(mensajeAmigable(err, 'No pudimos dejar de seguir.'), 'error');
    }
  };

  return (
    <main className="rs-contenedor rs-ancho rs-personas">
      <header className="rs-saludo">
        <h1>
          Personas <span>sugeridas</span>
        </h1>
        <p>Descubre gente conectada con tu red a través de amigos en común.</p>
      </header>

      {error && (
        <div className="rs-tarjeta rs-aviso-caja">
          <p>{error}</p>
          <button type="button" className="rs-boton rs-boton--primario rs-boton--chico" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {lista === null && (
        <div className="rs-tarjeta rs-personas-vacio">
          <p className="rs-sug-nota">Buscando personas…</p>
        </div>
      )}

      {lista?.length === 0 && !error && (
        <div className="rs-tarjeta rs-personas-vacio">
          <p className="rs-sug-nota">
            Cuando sigas a alguien, aquí te sugeriremos personas conectadas con tu red.
          </p>
          <Link to="/grafo" className="rs-boton rs-boton--fantasma">
            Ver el grafo de mi red
          </Link>
        </div>
      )}

      {lista?.length > 0 && (
        <div className="rs-personas-grid">
          {lista.map((p) => {
            const st = estado[p.id];
            const siguiendo = st === 'siguiendo';
            return (
              <article key={p.id} className="rs-tarjeta rs-persona-card">
                <Link to={`/perfil/${p.id}`} className="rs-persona-cabecera">
                  <Avatar nombre={p.nombre} tamano={56} />
                  <div className="rs-persona-info">
                    <h2 className="rs-persona-nombre">{p.nombre}</h2>
                    <p className="rs-persona-via">{textoVia(p.via, p.enComun)}</p>
                  </div>
                </Link>
                <div className="rs-persona-meta">
                  <span className="rs-chip">{p.enComun} en común</span>
                  {p.popularidad != null && (
                    <span className="rs-chip rs-chip--suave">{p.popularidad} seguidores</span>
                  )}
                </div>
                <div className="rs-persona-acciones">
                  {siguiendo ? (
                    <button
                      type="button"
                      className="rs-boton rs-boton--peligro rs-boton--chico"
                      disabled={st === 'cargando'}
                      onClick={() => alDejar(p)}
                    >
                      {st === 'cargando' ? '…' : 'Dejar de seguir'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rs-boton rs-boton--primario rs-boton--chico"
                      disabled={st === 'cargando'}
                      onClick={() => alSeguir(p)}
                    >
                      {st === 'cargando' ? '…' : 'Seguir'}
                    </button>
                  )}
                  <Link to={`/perfil/${p.id}`} className="rs-boton rs-boton--fantasma rs-boton--chico">
                    Ver perfil
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Toasts toasts={toasts} />
    </main>
  );
}
