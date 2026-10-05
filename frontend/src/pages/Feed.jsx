import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';
import { PostSkeleton } from '../components/PostSkeleton';
import { PerfilLateral } from '../components/PerfilLateral';
import { Sugeridos } from '../components/Sugeridos';
import { useAuth } from '../auth/AuthContext';
import { Toasts } from '../components/Toasts';
import { useToast } from '../hooks/useToast';
import { POR_PAGINA, mensajeAmigable, obtenerFeed } from '../services/posts';
import '../styles/posts.css';
import '../styles/feed.css';
import '../styles/synapse.css';

// Pantalla de inicio: publicaciones de las personas a las que sigo
export function Feed() {
  const [posts, setPosts] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const { toasts, mostrar } = useToast();
  const { usuario } = useAuth();

  useEffect(() => {
    let activo = true;
    async function cargarInicial() {
      setCargando(true);
      setError('');
      try {
        const datos = await obtenerFeed(0);
        if (!activo) return;
        setPosts(datos);
        setPagina(0);
        setHayMas(datos.length === POR_PAGINA);
      } catch (err) {
        if (activo) setError(mensajeAmigable(err, 'No pudimos cargar las publicaciones. Intenta nuevamente.'));
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarInicial();
    return () => {
      activo = false;
    };
  }, [intento]);

  const cargarMas = async () => {
    setCargandoMas(true);
    try {
      const datos = await obtenerFeed(pagina + 1);
      setPosts((lista) => {
        const ids = new Set(lista.map((p) => p.id));
        return [...lista, ...datos.filter((p) => !ids.has(p.id))];
      });
      setPagina((p) => p + 1);
      setHayMas(datos.length === POR_PAGINA);
    } catch (err) {
      mostrar(mensajeAmigable(err, 'No pudimos cargar más publicaciones. Intenta nuevamente.'), 'error');
    } finally {
      setCargandoMas(false);
    }
  };

  const actualizarPost = (nuevo) =>
    setPosts((lista) => lista.map((p) => (p.id === nuevo.id ? nuevo : p)));

  // El feed solo trae publicaciones de otras personas: la propia se agrega arriba mientras la pantalla está abierta
  const agregarPublicado = (post) => setPosts((lista) => [post, ...lista]);

  return (
    <main className="rs-contenedor rs-ancho">
      <div className="rs-saludo">
        <h1>Hola, <span>{usuario?.nombre?.split(' ')[0]}</span></h1>
        <p>Esto es lo que comparten las personas que sigues.</p>
      </div>
      <div className="rs-feed-grid">
      <PerfilLateral />
      <div>
      <PostComposer onPublicado={agregarPublicado} onMensaje={mostrar} />

      {cargando && (
        <div className="rs-lista" aria-busy="true" aria-label="Cargando publicaciones">
          <PostSkeleton conImagen />
          <PostSkeleton />
          <PostSkeleton conImagen />
        </div>
      )}

      {!cargando && error && (
        <div className="rs-tarjeta rs-vacio rs-vacio--error">
          <div className="rs-vacio-icono" aria-hidden="true">!</div>
          <h2>Algo salió mal</h2>
          <p>{error}</p>
          <button type="button" className="rs-boton rs-boton--primario" onClick={() => setIntento((n) => n + 1)}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {!cargando && !error && posts.length === 0 && (
        <div className="rs-tarjeta rs-vacio">
          <div className="rs-vacio-icono" aria-hidden="true">{'\u{1F44B}'}</div>
          <h2>Tu inicio está vacío por ahora</h2>
          <p>Cuando sigas a otras personas, sus publicaciones aparecerán aquí. Empieza descubriendo a quién seguir.</p>
          <Link to="/sugerencias" className="rs-boton rs-boton--primario">Descubrir personas</Link>
        </div>
      )}

      {!cargando && !error && posts.length > 0 && (
        <>
          <div className="rs-lista">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onCambio={actualizarPost}
                onError={(m) => mostrar(m, 'error')} />
            ))}
          </div>
          {hayMas && (
            <div className="rs-mas">
              <button type="button" className="rs-boton rs-boton--fantasma" onClick={cargarMas} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando\u2026' : 'Ver más publicaciones'}
              </button>
            </div>
          )}
        </>
      )}

      </div>
      <Sugeridos onSeguido={() => setIntento((n) => n + 1)} onMensaje={mostrar} />
      </div>
      <Toasts toasts={toasts} />
    </main>
  );
}