import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { mensajeAmigable, quitarReaccion, reaccionar, urlImagen } from '../services/posts';
import { fechaCompleta, tiempoRelativo } from '../utils/formato';
import '../styles/posts.css';

function IconoCorazon({ relleno }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

// Tarjeta de publicación. onCambio recibe el post actualizado; onError recibe un mensaje para mostrar.
export function PostCard({ post, onCambio, onError, detalle = false }) {
  const [enviando, setEnviando] = useState(false);
  const [imagenRota, setImagenRota] = useState(false);
  const imagen = urlImagen(post.mediaKey);

  const alternarReaccion = async () => {
    if (enviando) return;
    setEnviando(true);
    const antes = post;
    // Actualización inmediata; si falla, se revierte
    onCambio({
      ...post,
      yaReaccione: !post.yaReaccione,
      reacciones: Math.max(0, post.reacciones + (post.yaReaccione ? -1 : 1)),
    });
    try {
      if (antes.yaReaccione) {
        await quitarReaccion(post.id);
      } else {
        const r = await reaccionar(post.id);
        onCambio({ ...antes, reacciones: r.reacciones, yaReaccione: r.yaReaccione });
      }
    } catch (err) {
      onCambio(antes);
      onError?.(mensajeAmigable(err, 'No pudimos registrar tu reacción. Intenta nuevamente.'));
    } finally {
      setEnviando(false);
    }
  };

  const etiquetaReacciones = post.reacciones === 0 ? 'Me gusta' : `${post.reacciones} me gusta`;

  const contenidoImagen = imagen && !imagenRota && (
    <img
      src={imagen}
      alt={`Imagen publicada por ${post.autorNombre}`}
      className={`rs-post-imagen ${detalle ? 'rs-post-imagen--completa' : ''}`}
      loading="lazy"
      onError={() => setImagenRota(true)}
    />
  );

  return (
    <article className="rs-tarjeta rs-post">
      <header className="rs-post-cabecera">
        <Avatar nombre={post.autorNombre} />
        <div>
          <div className="rs-post-autor">{post.autorNombre}</div>
          {detalle ? (
            <span className="rs-post-fecha">{fechaCompleta(post.fecha)}</span>
          ) : (
            <Link to={`/post/${post.id}`} className="rs-post-fecha" title={fechaCompleta(post.fecha)}>
              {tiempoRelativo(post.fecha)}
            </Link>
          )}
        </div>
      </header>

      <p className={`rs-post-texto ${detalle ? 'rs-post-texto--grande' : ''}`}>{post.texto}</p>

      {contenidoImagen &&
        (detalle ? (
          <div className="rs-post-imagen-enlace">{contenidoImagen}</div>
        ) : (
          <Link to={`/post/${post.id}`} className="rs-post-imagen-enlace" aria-label="Abrir publicación">
            {contenidoImagen}
          </Link>
        ))}
      {imagen && imagenRota && (
        <div className="rs-post-imagen-error">No pudimos cargar la imagen de esta publicación.</div>
      )}

      <footer className="rs-post-pie">
        <button
          type="button"
          className={`rs-reaccion ${post.yaReaccione ? 'rs-reaccion--activa' : ''}`}
          onClick={alternarReaccion}
          disabled={enviando}
          aria-pressed={post.yaReaccione}
          aria-label={post.yaReaccione ? 'Quitar me gusta' : 'Dar me gusta'}
        >
          <IconoCorazon relleno={post.yaReaccione} />
          <span>{etiquetaReacciones}</span>
        </button>
        {!detalle && (
          <Link to={`/post/${post.id}`} className="rs-enlace-detalle">
            Ver publicación
          </Link>
        )}
      </footer>
    </article>
  );
}