import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { useAuth } from '../auth/AuthContext';
import { mensajeAmigable } from '../services/posts';
import { obtenerGrafo } from '../services/social';
import '../styles/posts.css';
import '../styles/feed.css';
import '../styles/synapse.css';
import '../styles/personas.css';

const COLORES = ['#6366f1', '#06b6d4', '#f43f5e', '#16a34a', '#d97706', '#7c3aed', '#0d9488', '#db2777'];

function colorDe(id = '') {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[hash % COLORES.length];
}

// Pantalla del grafo social interactivo (Persona A)
export function Grafo() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [hover, setHover] = useState(null);
  const contenedorRef = useRef(null);
  const grafRef = useRef(null);
  const [dim, setDim] = useState({ w: 800, h: 520 });

  const cargar = useCallback(() => {
    setError('');
    setDatos(null);
    obtenerGrafo()
      .then((g) => {
        const nodos = (g.nodos || []).map((n) => ({ ...n, color: colorDe(n.id) }));
        const enlaces = (g.enlaces || []).map((e) => ({ source: e.source, target: e.target }));
        setDatos({ nodes: nodos, links: enlaces });
      })
      .catch((err) => {
        setError(mensajeAmigable(err, 'No pudimos cargar el grafo. Intenta nuevamente.'));
      });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return undefined;
    const medir = () => {
      const r = el.getBoundingClientRect();
      setDim({ w: Math.max(320, Math.floor(r.width)), h: Math.max(360, Math.floor(r.height)) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [datos]);

  const grafoData = useMemo(() => {
    if (!datos) return { nodes: [], links: [] };
    return datos;
  }, [datos]);

  const pintarNodo = useCallback(
    (node, ctx, globalScale) => {
      const r = Math.max(6, 14 / Math.sqrt(globalScale));
      const esYo = usuario?.id && node.id === usuario.id;
      const resaltado = hover && hover === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (esYo || resaltado ? 3 : 0), 0, 2 * Math.PI);
      ctx.fillStyle = esYo ? '#f43f5e' : node.color || '#6366f1';
      ctx.fill();

      if (esYo) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const label = node.nombre || node.id;
      const fontSize = Math.max(10, 12 / globalScale);
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue('--rs-texto').trim() || '#e5e7ef';
      ctx.fillText(label, node.x, node.y + r + 3);
    },
    [usuario?.id, hover],
  );

  const alClicNodo = useCallback((node) => {
    if (node?.id) {
      window.location.href = `/perfil/${node.id}`;
    }
  }, []);

  return (
    <main className="rs-contenedor rs-ancho rs-grafo-pagina">
      <header className="rs-saludo">
        <h1>
          Grafo <span>social</span>
        </h1>
        <p>
          Visualiza las relaciones de seguimiento. Tu nodo aparece en rosa. Arrastra, haz zoom y haz clic en un nodo
          para abrir su perfil.
        </p>
      </header>

      {error && (
        <div className="rs-tarjeta rs-aviso-caja">
          <p>{error}</p>
          <button type="button" className="rs-boton rs-boton--primario rs-boton--chico" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {!datos && !error && (
        <div className="rs-tarjeta rs-personas-vacio">
          <p className="rs-sug-nota">Cargando grafo…</p>
        </div>
      )}

      {datos && (
        <>
          <div className="rs-grafo-meta">
            <span className="rs-chip">{datos.nodes.length} personas</span>
            <span className="rs-chip rs-chip--suave">{datos.links.length} conexiones</span>
            <Link to="/sugerencias" className="rs-boton rs-boton--fantasma rs-boton--chico">
              Ver sugerencias
            </Link>
          </div>
          <div className="rs-tarjeta rs-grafo-canvas" ref={contenedorRef}>
            <ForceGraph2D
              ref={grafRef}
              graphData={grafoData}
              width={dim.w}
              height={dim.h}
              nodeId="id"
              nodeLabel="nombre"
              nodeCanvasObject={pintarNodo}
              nodePointerAreaPaint={(node, color, ctx) => {
                const r = 12;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
              }}
              linkColor={() => 'rgba(148, 163, 184, 0.45)'}
              linkWidth={1.2}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              onNodeHover={(n) => setHover(n ? n.id : null)}
              onNodeClick={alClicNodo}
              cooldownTicks={80}
              onEngineStop={() => grafRef.current?.zoomToFit(400, 40)}
              backgroundColor="transparent"
            />
          </div>
        </>
      )}
    </main>
  );
}
