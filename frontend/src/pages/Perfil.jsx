import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Toasts } from '../components/Toasts';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../hooks/useToast';
import { mensajeAmigable } from '../services/posts';
import {
  obtenerUsuario,
  obtenerEstado,
  obtenerSeguidores,
  obtenerSeguidos,
  obtenerEnComun,
  seguir,
  dejarDeSeguir,
  actualizarPerfil,
} from '../services/social';
import '../styles/posts.css';
import '../styles/feed.css';
import '../styles/synapse.css';
import '../styles/personas.css';

const comoLista = (d) => (Array.isArray(d) ? d : []);

// Pantalla de perfil de usuario (Persona A)
export function Perfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: yo } = useAuth();
  const esMio = Boolean(yo?.id && (id === yo.id || id === 'me'));
  const idReal = esMio ? yo.id : id;

  const [perfil, setPerfil] = useState(null);
  const [estado, setEstado] = useState(null);
  const [seguidores, setSeguidores] = useState(null);
  const [seguidos, setSeguidos] = useState(null);
  const [enComun, setEnComun] = useState(null);
  const [tab, setTab] = useState('seguidores');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('');
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const { toasts, mostrar } = useToast();

  useEffect(() => {
    if (!idReal) return undefined;
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([
      obtenerUsuario(idReal),
      esMio ? Promise.resolve(null) : obtenerEstado(idReal).catch(() => null),
      obtenerSeguidores(idReal).catch(() => []),
      obtenerSeguidos(idReal).catch(() => []),
      esMio ? Promise.resolve([]) : obtenerEnComun(idReal).catch(() => []),
    ])
      .then(([u, e, seg, sdo, com]) => {
        if (!activo) return;
        setPerfil(u);
        setEstado(e);
        setSeguidores(comoLista(seg));
        setSeguidos(comoLista(sdo));
        setEnComun(comoLista(com));
        setNombre(u?.nombre || '');
        setBio(u?.bio || '');
      })
      .catch((err) => {
        if (!activo) return;
        setError(mensajeAmigable(err, 'No pudimos cargar este perfil.'));
        setPerfil(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [idReal, esMio]);

  // Redirigir al chat pasando el contacto en el estado de navegación
  const irAChat = (contacto) => {
    navigate('/chat', {
      state: {
        contacto: {
          id: contacto.id,
          nombre: contacto.nombre,
        },
      },
    });
  };

  const alSeguir = async () => {
    setAccion('seguir');
    try {
      await seguir(idReal);
      setEstado((e) => (e ? { ...e, sigo: true, seguidores: e.seguidores + 1 } : e));
      mostrar(`Ahora sigues a ${perfil?.nombre}.`, 'ok');
      obtenerSeguidores(idReal).then((d) => setSeguidores(comoLista(d)));
    } catch (err) {
      mostrar(mensajeAmigable(err, 'No pudimos seguir a esta persona.'), 'error');
    } finally {
      setAccion('');
    }
  };

  const alDejar = async () => {
    setAccion('dejar');
    try {
      await dejarDeSeguir(idReal);
      setEstado((e) => (e ? { ...e, sigo: false, seguidores: Math.max(0, e.seguidores - 1) } : e));
      mostrar(`Dejaste de seguir a ${perfil?.nombre}.`, 'ok');
      obtenerSeguidores(idReal).then((d) => setSeguidores(comoLista(d)));
    } catch (err) {
      mostrar(mensajeAmigable(err, 'No pudimos dejar de seguir.'), 'error');
    } finally {
      setAccion('');
    }
  };

  const guardarPerfil = async (ev) => {
    ev.preventDefault();
    setAccion('guardar');
    try {
      const actualizado = await actualizarPerfil(nombre.trim(), bio.trim());
      setPerfil(actualizado);
      setEditando(false);
      mostrar('Perfil actualizado.', 'ok');
    } catch (err) {
      mostrar(mensajeAmigable(err, 'No pudimos guardar los cambios.'), 'error');
    } finally {
      setAccion('');
    }
  };

  if (cargando) {
    return (
      <main className="rs-contenedor rs-ancho">
        <div className="rs-tarjeta rs-personas-vacio">
          <p className="rs-sug-nota">Cargando perfil…</p>
        </div>
      </main>
    );
  }

  if (error || !perfil) {
    return (
      <main className="rs-contenedor rs-ancho">
        <div className="rs-tarjeta rs-aviso-caja">
          <p>{error || 'Usuario no encontrado.'}</p>
          <button
            type="button"
            className="rs-boton rs-boton--primario rs-boton--chico"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const nSeguidores = estado?.seguidores ?? seguidores?.length ?? 0;
  const nSeguidos = estado?.seguidos ?? seguidos?.length ?? 0;
  const listaTab = tab === 'seguidores' ? seguidores : tab === 'seguidos' ? seguidos : enComun;

  return (
    <main className="rs-contenedor rs-ancho rs-perfil-pagina">
      <section className="rs-tarjeta rs-perfil-cabecera">
        <Avatar nombre={perfil.nombre} tamano={88} />
        <div className="rs-perfil-datos">
          <h1>{perfil.nombre}</h1>
          {perfil.bio ? (
            <p className="rs-perfil-bio">{perfil.bio}</p>
          ) : (
            <p className="rs-perfil-bio rs-perfil-bio--vacia">Sin biografía</p>
          )}
          <div className="rs-stats rs-stats--perfil">
            <div>
              <strong>{nSeguidores}</strong>
              <span>Seguidores</span>
            </div>
            <div>
              <strong>{nSeguidos}</strong>
              <span>Siguiendo</span>
            </div>
            {!esMio && enComun != null && (
              <div>
                <strong>{enComun.length}</strong>
                <span>En común</span>
              </div>
            )}
          </div>
          <div className="rs-perfil-acciones">
            {esMio ? (
              <button
                type="button"
                className="rs-boton rs-boton--fantasma rs-boton--chico"
                onClick={() => setEditando((v) => !v)}
              >
                {editando ? 'Cancelar' : 'Editar perfil'}
              </button>
            ) : (
              <>
                {estado?.sigo ? (
                  <button
                    type="button"
                    className="rs-boton rs-boton--peligro rs-boton--chico"
                    disabled={Boolean(accion)}
                    onClick={alDejar}
                  >
                    {accion === 'dejar' ? '…' : 'Dejar de seguir'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rs-boton rs-boton--primario rs-boton--chico"
                    disabled={Boolean(accion)}
                    onClick={alSeguir}
                  >
                    {accion === 'seguir' ? '…' : 'Seguir'}
                  </button>
                )}

                {estado?.meSigue && <span className="rs-chip rs-chip--suave">Te sigue</span>}
              </>
            )}
            <Link to="/grafo" className="rs-boton rs-boton--fantasma rs-boton--chico">
              Ver grafo
            </Link>
            {/* Botón para enviar mensaje al perfil visto (no tiene sentido en mi propio perfil) */}
            {!esMio && (
              <button
                type="button"
                className="rs-boton rs-boton--fantasma rs-boton--chico"
                onClick={() => irAChat(perfil)}
              >
                Enviar mensaje
              </button>
            )}
          </div>
        </div>
      </section>

      {editando && esMio && (
        <form className="rs-tarjeta rs-perfil-editar" onSubmit={guardarPerfil}>
          <label className="ui-campo">
            <span>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
              required
              className="rs-input"
            />
          </label>
          <label className="ui-campo">
            <span>Biografía</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              className="rs-input rs-textarea"
              placeholder="Cuéntanos algo sobre ti…"
            />
          </label>
          <button type="submit" className="rs-boton rs-boton--primario" disabled={accion === 'guardar'}>
            {accion === 'guardar' ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}

      <nav className="rs-perfil-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'seguidores'}
          className={`rs-tab ${tab === 'seguidores' ? 'activo' : ''}`}
          onClick={() => setTab('seguidores')}
        >
          Seguidores
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'seguidos'}
          className={`rs-tab ${tab === 'seguidos' ? 'activo' : ''}`}
          onClick={() => setTab('seguidos')}
        >
          Siguiendo
        </button>
        {!esMio && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'comun'}
            className={`rs-tab ${tab === 'comun' ? 'activo' : ''}`}
            onClick={() => setTab('comun')}
          >
            En común
          </button>
        )}
      </nav>

      <section className="rs-tarjeta rs-perfil-lista">
        {listaTab === null && <p className="rs-sug-nota">Cargando…</p>}
        {listaTab?.length === 0 && (
          <p className="rs-sug-nota">
            {tab === 'seguidores' && 'Todavía no tiene seguidores.'}
            {tab === 'seguidos' && 'Todavía no sigue a nadie.'}
            {tab === 'comun' && 'No tienen personas en común.'}
          </p>
        )}
        {listaTab?.map((p) => {
          const esEsteMio = Boolean(yo?.id && p.id === yo.id);
          return (
            <div
              key={p.id}
              className="rs-sug-fila rs-perfil-fila"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Link
                to={`/perfil/${p.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  flex: 1,
                }}
              >
                <Avatar nombre={p.nombre} tamano={40} />
                <div className="rs-sug-info">
                  <div className="rs-sug-nombre">{p.nombre}</div>
                  {p.bio && <div className="rs-sug-via">{p.bio}</div>}
                </div>
              </Link>

              {/* Botón para enviar mensaje a este seguidor/seguido */}
              {!esEsteMio && (
                <button
                  type="button"
                  className="rs-boton rs-boton--chico"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    marginLeft: '8px',
                    fontSize: '0.85rem',
                    padding: '4px 10px',
                  }}
                  onClick={() => irAChat(p)}
                >
                  Mensaje
                </button>
              )}
            </div>
          );
        })}
      </section>

      <Toasts toasts={toasts} />
    </main>
  );
}