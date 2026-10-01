import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { Toasts } from '../components/Toasts';
import { useToast } from '../hooks/useToast';
import { mensajeAmigable, obtenerPost } from '../services/posts';
import '../styles/posts.css';

// Detalle de una publicación (destino de las notificaciones push)
export function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const { toasts, mostrar } = useToast();

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const datos = await obtenerPost(id);
        if (activo) setPost(datos);
      } catch (err) {
        if (!activo) return;
        const noExiste = /no encontrada/i.test(err?.message ?? '');
        setError(
          noExiste
            ? 'Esta publicación no existe o ya no está disponible.'
            : mensajeAmigable(err, 'No pudimos cargar la publicación. Intenta nuevamente.'),
        );
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [id, intento]);

  return (
    <main className="rs-contenedor">
      <Link to="/" className="rs-volver">{'\u2190'} Volver al inicio</Link>

      {cargando && <PostSkeleton conImagen />}

      {!cargando && error && (
        <div className="rs-tarjeta rs-vacio rs-vacio--error">
          <div className="rs-vacio-icono" aria-hidden="true">!</div>
          <h2>No pudimos mostrar la publicación</h2>
          <p>{error}</p>
          <button type="button" className="rs-boton rs-boton--primario" onClick={() => setIntento((n) => n + 1)}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {!cargando && !error && post && (
        <PostCard post={post} detalle onCambio={setPost} onError={(m) => mostrar(m, 'error')} />
      )}

      <Toasts toasts={toasts} />
    </main>
  );
}