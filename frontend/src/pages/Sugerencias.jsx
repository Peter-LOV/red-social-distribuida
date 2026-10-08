import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Toasts } from '../components/Toasts';
import { useToast } from '../hooks/useToast';
import { mensajeAmigable } from '../services/posts';
import { buscarUsuarios, obtenerSugerencias, seguir, dejarDeSeguir } from '../services/social';
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
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState(null); // null = no se ha buscado
  const [buscando, setBuscando] = useState(false);
  const { toasts, mostrar } = useToast();

  const ultimaBusqueda = useRef(0);

  const ejecutarBusqueda = async (consulta) => {
    const turno = ++ultimaBusqueda.current;
    setBuscando(true);
    try {
      const encontrados = await buscarUsuarios(consulta);
      // Si mientras tanto se escribió otra cosa, esta respuesta ya no interesa
      if (turno !== ultimaBusqueda.current) return;
      setResultados(Array.isArray(encontrados) ? encontrados : []);
      // El backend indica a quién sigo ya, para pintar el botón correcto
      setEstado((s) => {
        const nuevo = { ...s };
        (encontrados || []).forEach((p) => {
          if (p.sigo && !nuevo[p.id]) nuevo[p.id] = 'siguiendo';
        });
        return nuevo;
      });
    } catch (err) {
      if (turno === ultimaBusqueda.current) {
        mostrar(mensajeAmigable(err, 'No pudimos buscar. Intenta nuevamente.'), 'error');
      }
    } finally {
      if (turno === ultimaBusqueda.current) setBuscando(false);
    }
  };

  // Busca sola mientras se escribe: espera 300 ms tras la última tecla para no lanzar una petición por letra
  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < 2) {
      ultimaBusqueda.current += 1;
      setResultados(null);
      setBuscando(false);
      return undefined;
    }
    const espera = setTimeout(() => ejecutarBusqueda(consulta), 300);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const buscar = (e) => {
    e.preventDefault();
    const consulta = texto.trim();
    if (consulta.length < 2) {
      mostrar('Escribe al menos 2 letras para buscar.', 'aviso');
      return;
    }
    ejecutarBusqueda(consulta);
  };

  const limpiarBusqueda = () => {
    setTexto('');
    setResultados(null);
  };

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
        <p>Busca a alguien por su nombre o descubre gente conectada con tu red.</p>
      </header>

      <form className="rs-tarjeta" onSubmit={buscar} role="search"
        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <label htmlFor="rs-buscar" className="rs-oculto">Buscar personas por nombre</label>
        <input
          id="rs-buscar"
          type="search"
          aria-label="Buscar personas por nombre"
          className="rs-input"
          style={{ flex: 1 }}
          placeholder="Buscar personas por nombre (mínimo 2 letras)…"
          value={texto}
          maxLength={50}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="rs-boton rs-boton--primario rs-boton--chico" disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
        {resultados !== null && (
          <button type="button" className="rs-boton rs-boton--fantasma rs-boton--chico" onClick={limpiarBusqueda}>
            Limpiar
          </button>
        )}
      </form>

      {resultados !== null && (
        <section aria-live="polite" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>
            {resultados.length === 0
              ? 'No encontramos a nadie con ese nombre.'
              : `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}`}
          </h2>
          {resultados.length > 0 && (
            <div className="rs-personas-grid">
              {resultados.map((p) => {
                const st = estado[p.id];
                const siguiendo = st === 'siguiendo';
                return (
                  <article key={p.id} className="rs-tarjeta rs-persona-card">
                    <Link to={`/perfil/${p.id}`} className="rs-persona-cabecera">
                      <Avatar nombre={p.nombre} tamano={56} />
                      <div className="rs-persona-info">
                        <h3 className="rs-persona-nombre">{p.nombre}</h3>
                        {p.bio && <p className="rs-persona-via">{p.bio}</p>}
                      </div>
                    </Link>
                    <div className="rs-persona-acciones">
                      <button
                        type="button"
                        className={`rs-boton rs-boton--chico ${siguiendo ? 'rs-boton--peligro' : 'rs-boton--primario'}`}
                        disabled={st === 'cargando'}
                        onClick={() => (siguiendo ? alDejar(p) : alSeguir(p))}
                      >
                        {st === 'cargando' ? '…' : siguiendo ? 'Dejar de seguir' : 'Seguir'}
                      </button>
                      <Link to={`/perfil/${p.id}`} className="rs-boton rs-boton--fantasma rs-boton--chico">
                        Ver perfil
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {resultados !== null && <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Sugerencias para ti</h2>}

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
