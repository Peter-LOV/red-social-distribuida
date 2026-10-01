import '../styles/posts.css';

// Esqueleto de carga con la forma de una publicación
export function PostSkeleton({ conImagen = false }) {
  return (
    <div className="rs-tarjeta rs-post" aria-hidden="true">
      <div className="rs-post-cabecera">
        <div className="rs-skeleton-circulo" />
        <div style={{ flex: 1 }}>
          <div className="rs-skeleton-linea" style={{ width: '35%' }} />
          <div className="rs-skeleton-linea" style={{ width: '20%', marginBottom: 0 }} />
        </div>
      </div>
      <div className="rs-skeleton-linea" style={{ width: '95%' }} />
      <div className="rs-skeleton-linea" style={{ width: '70%' }} />
      {conImagen && <div className="rs-skeleton-bloque" />}
    </div>
  );
}