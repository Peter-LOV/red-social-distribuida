import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, WS_URL } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import '../styles/chat.css';

export function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [fondoChat, setFondoChat] = useState(() => {
    return localStorage.getItem('synapse-chat-bg') || 'bg-dots';
  });

  const cambiarFondo = (nuevoFondo) => {
    setFondoChat(nuevoFondo);
    localStorage.setItem('synapse-chat-bg', nuevoFondo);
  };
  const [cargandoConv, setCargandoConv] = useState(true);

  // Selector de nuevo chat
  const [vistaNuevoChat, setVistaNuevoChat] = useState(false);
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [tabContactos, setTabContactos] = useState('seguidores');
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [contactoProvisional, setContactoProvisional] = useState(null);

  const [conectado, setConectado] = useState(false);
  const [avisoChat, setAvisoChat] = useState('');

  const conversacionActivaRef = useRef(null);
  const miIdRef = useRef(null);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  // Mensajes escritos mientras el socket no estaba abierto: se envían al (re)conectar
  const pendientesRef = useRef([]);
  const procesarSocketRef = useRef(null);

  const token = localStorage.getItem('token');
  // El id propio viene de la sesión (GET /usuarios/me); esta pantalla solo se muestra con sesión iniciada
  const miId = usuario?.id;

  useEffect(() => {
    conversacionActivaRef.current = conversacionActiva;
  }, [conversacionActiva]);

  useEffect(() => {
    miIdRef.current = miId;
  }, [miId]);

  const STORAGE_KEY_VISTOS = `synapse_chat_vistos_${miId}`;

  const obtenerVistos = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || '{}');
    } catch {
      return {};
    }
  };

  const marcarVisto = (convId, mensajeId) => {
    if (!convId || !mensajeId || mensajeId === 'visto') return;
    const vistos = obtenerVistos();
    vistos[convId] = String(mensajeId);
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(vistos));
    window.dispatchEvent(new Event('chat:status-changed'));
  };

  const calcularNoLeido = (conv, vistos = obtenerVistos()) => {
    if (!conv?.id || !conv?.ultimoMensajeId || !conv?.ultimoTexto) return false;
    if (conv.ultimoAutorId != null && String(conv.ultimoAutorId) === String(miId)) {
      return false;
    }
    return String(vistos[conv.id] ?? '') !== String(conv.ultimoMensajeId);
  };

  // 1. Cargar lista de conversaciones
  useEffect(() => {
    cargarConversaciones();
  }, []);

  async function cargarConversaciones(idParaActivar = null) {
    try {
      setCargandoConv(true);
      const datos = await api('/chat/conversaciones');
      const vistos = obtenerVistos();

      const listaProcesada = (datos || []).map((conv) => ({
        ...conv,
        noLeido: calcularNoLeido(conv, vistos),
      }));

      setConversaciones(listaProcesada);

      // Si viene un usuario desde otra pantalla (como Perfil o Sugerencias)
      const contactoExterno = location.state?.contacto;
      if (contactoExterno) {
        prepararChatConUsuario(contactoExterno, listaProcesada);
        // Limpiar el estado de react-router para evitar que se repita al recargar
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      if (idParaActivar) {
        const encontrada = listaProcesada.find((c) => String(c.id) === String(idParaActivar));
        if (encontrada) {
          seleccionarConversacion(encontrada);
        }
      }
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    } finally {
      setCargandoConv(false);
    }
  }

  // 2. WebSocket: una sola conexión persistente mientras esta pantalla está abierta
  const procesarMensajeSocket = (evento) => {
    try {
      const payload = JSON.parse(evento.data);
      if (payload.tipo === 'error') {
        // El servidor rechazó el envío: se retira el mensaje provisional y se avisa
        setMensajes((prev) => prev.filter((m) => !m.tempId));
        setAvisoChat(payload.error || 'No se pudo enviar el mensaje.');
        return;
      }
      if (payload.tipo !== 'mensaje') return;

      const convId = String(payload.conversacionId);
      const mensajeId = String(payload.id);
      const idChatAbierto = conversacionActivaRef.current?.id;
      const estaEnEsteChat = String(idChatAbierto ?? '') === convId;
      const idActual = miIdRef.current;
      const esMio = String(payload.autorId) === String(idActual);

      if (estaEnEsteChat) {
        setMensajes((prev) => {
          const existePorId = prev.some((m) => String(m.id) === mensajeId);
          if (existePorId) return prev;

          const indiceTemp = prev.findIndex(
            (m) => m.tempId && m.texto === payload.texto && String(m.autorId) === String(payload.autorId)
          );

          if (indiceTemp !== -1) {
            return prev.map((m, i) => (i === indiceTemp ? payload : m));
          }

          return [...prev, payload];
        });

        marcarVisto(convId, mensajeId);
      }

      const vistos = obtenerVistos();
      const noLeido = !estaEnEsteChat && !esMio && String(vistos[convId] ?? '') !== mensajeId;

      setConversaciones((prev) => {
        const existe = prev.some((c) => String(c.id) === convId);

        if (!existe) {
          void cargarConversaciones(estaEnEsteChat ? payload.conversacionId : null);
          return prev;
        }

        return prev.map((c) => {
          if (String(c.id) !== convId) return c;
          return {
            ...c,
            ultimoTexto: payload.texto,
            ultimaFecha: payload.fecha,
            ultimoMensajeId: mensajeId,
            ultimoAutorId: payload.autorId,
            noLeido,
          };
        });
      });

      if (!esMio) {
        window.dispatchEvent(new Event('chat:status-changed'));
      }
    } catch (err) {
      console.error('Error procesando socket:', err);
    }
  };

  // El socket siempre llama a la versión más reciente del manejador
  useEffect(() => {
    procesarSocketRef.current = procesarMensajeSocket;
  });

  useEffect(() => {
    if (!token) return undefined;

    let activo = true;
    let ws = null;
    let temporizador = null;
    let intentos = 0;

    const conectar = () => {
      if (!activo) return;

      ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        intentos = 0;
        setConectado(true);
        const cola = pendientesRef.current;
        pendientesRef.current = [];
        cola.forEach((paquete) => ws.send(JSON.stringify(paquete)));
      };

      ws.onmessage = (evento) => procesarSocketRef.current?.(evento);

      ws.onclose = () => {
        setConectado(false);
        // Al salir de la pantalla no se reconecta; si la conexión se cayó, se reintenta cada vez más espaciado
        if (!activo) return;
        intentos += 1;
        temporizador = setTimeout(conectar, Math.min(1500 * 2 ** (intentos - 1), 15000));
      };
    };

    conectar();

    return () => {
      activo = false;
      clearTimeout(temporizador);
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // 3. Abrir conversación
  async function seleccionarConversacion(conv) {
    setVistaNuevoChat(false);
    setContactoProvisional(null);

    conversacionActivaRef.current = conv;
    if (conv.ultimoMensajeId) {
      marcarVisto(conv.id, conv.ultimoMensajeId);
    }

    setConversaciones((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, noLeido: false } : c))
    );

    setConversacionActiva(conv);
    try {
      const historial = await api(`/chat/conversaciones/${conv.id}/mensajes`);
      setMensajes(historial || []);
      if (historial && historial.length > 0) {
        const ultimoId = historial[historial.length - 1].id;
        marcarVisto(conv.id, ultimoId);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }

  // 4. Enviar mensaje
  async function manejarEnvio(e) {
    e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto) return;
    setAvisoChat('');

    let convId = conversacionActiva?.id;
    const tempId = `temp-${Date.now()}`; // ✅ Generado antes de usarlo

    if (!convId && contactoProvisional) {
      try {
        const res = await api('/chat/conversaciones', {
          metodo: 'POST',
          cuerpo: { usuarioId: contactoProvisional.id },
        });
        convId = res.conversacionId;

        const nuevaConv = {
          id: convId,
          otroId: contactoProvisional.id,
          otroNombre: contactoProvisional.nombre,
          ultimoTexto: texto,
          ultimaFecha: new Date().toISOString(),
          ultimoMensajeId: tempId,
          noLeido: false,
        };

        marcarVisto(convId, tempId);
        setConversacionActiva(nuevaConv);
        setConversaciones((prev) => [nuevaConv, ...prev.filter((c) => c.id !== convId)]);
        setContactoProvisional(null);
      } catch (err) {
        alert(err.message || 'Error al iniciar la conversación');
        return;
      }
    }

    if (!convId) return;

    const mensajeOptimista = {
      id: tempId,
      tempId: true,
      conversacionId: convId,
      autorId: miId,
      texto: texto,
      fecha: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeOptimista]);
    setNuevoMensaje('');

    setConversaciones((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, ultimoTexto: texto, ultimaFecha: mensajeOptimista.fecha, ultimoMensajeId: tempId, noLeido: false }
          : c
      )
    );

    marcarVisto(convId, tempId);

    // Siempre por WebSocket. Si la conexión se está restableciendo, el mensaje espera en cola
    const paquete = { conversacionId: convId, texto };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(paquete));
    } else {
      pendientesRef.current.push(paquete);
    }
  }

  // 5. Contactos
  async function abrirNuevoChat() {
    conversacionActivaRef.current = null;
    setConversacionActiva(null);
    setContactoProvisional(null);
    setVistaNuevoChat(true);
    setCargandoContactos(true);
    try {
      const [segdores, segdos] = await Promise.all([
        api(`/social/seguidores/${miId}`).catch(() => []),
        api(`/social/seguidos/${miId}`).catch(() => []),
      ]);

      setSeguidores(Array.isArray(segdores) ? segdores : []);
      setSiguiendo(Array.isArray(segdos) ? segdos : []);
    } catch (err) {
      console.error('Error cargando contactos:', err);
    } finally {
      setCargandoContactos(false);
    }
  }

  function prepararChatConUsuario(contacto, lista = conversaciones) {
    setVistaNuevoChat(false);
    const existente = lista.find((c) => String(c.otroId) === String(contacto.id));
    if (existente) {
      seleccionarConversacion(existente);
    } else {
      conversacionActivaRef.current = null;
      setConversacionActiva(null);
      setContactoProvisional(contacto);
      setMensajes([]);
    }
  }

  const listaActual = tabContactos === 'seguidores' ? seguidores : siguiendo;
  const usuarioEnPantalla = conversacionActiva?.otroNombre || contactoProvisional?.nombre;

  return (
    <div className="chat-container">
      {/* Sidebar lateral */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">
            Mensajes{' '}
            <span
              title={conectado ? 'Conectado en tiempo real (WebSocket)' : 'Reconectando…'}
              style={{ fontSize: '0.7rem', color: conectado ? '#22c55e' : '#f59e0b', verticalAlign: 'middle' }}
            >
              {conectado ? '● en línea' : '○ reconectando…'}
            </span>
          </h2>
          <button onClick={abrirNuevoChat} className="chat-btn-nuevo" title="Iniciar conversación">
            + Nuevo
          </button>
        </div>

        <div className="chat-conv-list">
          {cargandoConv ? (
            <p className="chat-empty-text">Cargando conversaciones...</p>
          ) : conversaciones.length === 0 && !contactoProvisional ? (
            <div className="chat-empty-box">
              <p className="chat-empty-text">No tienes chats activos.</p>
            </div>
          ) : (
            <>
              {contactoProvisional && (
                <div className="chat-conv-item active provisional">
                  <div className="chat-avatar">
                    {contactoProvisional.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-conv-meta">
                    <div className="chat-conv-nombre">{contactoProvisional.nombre}</div>
                    <div className="chat-conv-preview" style={{ color: '#38bdf8' }}>Borrador nuevo...</div>
                  </div>
                </div>
              )}

              {conversaciones.map((conv) => {
                const activa = !vistaNuevoChat && conversacionActiva?.id === conv.id;

                return (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => seleccionarConversacion(conv)}
                    onKeyDown={(e) => e.key === 'Enter' && seleccionarConversacion(conv)}
                    className={`chat-conv-item ${activa ? 'active' : ''} ${conv.noLeido ? 'unopened' : ''}`}
                  >
                    <div className="chat-avatar">
                      {conv.otroNombre ? conv.otroNombre.charAt(0).toUpperCase() : '?'}
                    </div>

                    <div className="chat-conv-meta">
                      <div className="chat-conv-top-line">
                        <span className={`chat-conv-nombre ${conv.noLeido ? 'unread-title' : ''}`}>
                          {conv.otroNombre}
                        </span>
                      </div>

                      <div className={`chat-conv-preview ${conv.noLeido ? 'unread' : ''}`}>
                        {conv.ultimoTexto || 'Conversación iniciada'}
                      </div>
                    </div>

                    {conv.noLeido && (
                      <span className="chat-unread-star" title="Mensaje sin leer">
                        ★
                      </span>
                    )}

                    {conv.ultimaFecha && (
                      <span className="chat-conv-time-preview">
                        {new Date(conv.ultimaFecha).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Panel principal */}
      <div className="chat-area">
        {vistaNuevoChat ? (
          <div className="chat-new-container">
            <div className="chat-new-header">
              <h3>Nueva conversación</h3>
              <button className="chat-modal-close" onClick={() => setVistaNuevoChat(false)}>✕</button>
            </div>

            <div className="perfil-tabs-container">
              <button
                className={`perfil-tab-btn ${tabContactos === 'seguidores' ? 'active' : ''}`}
                onClick={() => setTabContactos('seguidores')}
              >
                Seguidores ({seguidores.length})
              </button>
              <button
                className={`perfil-tab-btn ${tabContactos === 'siguiendo' ? 'active' : ''}`}
                onClick={() => setTabContactos('siguiendo')}
              >
                Siguiendo ({siguiendo.length})
              </button>
            </div>

            <div className="chat-contact-list">
              {cargandoContactos ? (
                <p className="chat-empty-text">Cargando usuarios...</p>
              ) : listaActual.length === 0 ? (
                <div className="chat-empty-box">
                  <p className="chat-empty-text">
                    No tienes {tabContactos === 'seguidores' ? 'seguidores' : 'usuarios seguidos'} aún.
                  </p>
                </div>
              ) : (
                listaActual.map((contacto) => (
                  <div
                    key={contacto.id}
                    className="perfil-user-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => prepararChatConUsuario(contacto)}
                    onKeyDown={(e) => e.key === 'Enter' && prepararChatConUsuario(contacto)}
                  >
                    <div className="perfil-user-avatar">
                      {contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="perfil-user-info">
                      <span className="perfil-user-name">{contacto.nombre}</span>
                    </div>
                    <button className="chat-btn-elegir">Chatear</button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : conversacionActiva || contactoProvisional ? (
          <>
            <div className="chat-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="chat-avatar">
                  {usuarioEnPantalla?.charAt(0).toUpperCase()}
                </div>
                <span className="chat-header-name">{usuarioEnPantalla}</span>
              </div>
  
              {/* Agrega este bloque para seleccionar los fondos a la derecha: */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="chat-bg-selector" title="Cambiar fondo del chat">
                  <button 
                    type="button" 
                    onClick={() => cambiarFondo('bg-default')} 
                    className={`chat-bg-dot ${fondoChat === 'bg-default' ? 'activo' : ''}`} 
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} 
                    title="Limpio" 
                  />
                  <button 
                    type="button" 
                    onClick={() => cambiarFondo('bg-grid')} 
                    className={`chat-bg-dot ${fondoChat === 'bg-grid' ? 'activo' : ''}`} 
                    style={{ backgroundColor: '#cbd5e1' }} 
                    title="Cuadrícula" 
                  />
                  <button 
                    type="button" 
                    onClick={() => cambiarFondo('bg-sky')} 
                    className={`chat-bg-dot ${fondoChat === 'bg-sky' ? 'activo' : ''}`} 
                    style={{ backgroundColor: '#bae6fd' }} 
                    title="Celeste" 
                  />
                  <button 
                    type="button" 
                    onClick={() => cambiarFondo('bg-warm')} 
                    className={`chat-bg-dot ${fondoChat === 'bg-warm' ? 'activo' : ''}`} 
                    style={{ backgroundColor: '#e2d9cc' }} 
                    title="Arena Cálido" 
                  />
                </div>

                <button 
                  className="chat-modal-close" 
                  onClick={() => {
                    setConversacionActiva(null);
                    setContactoProvisional(null);
                  }}
                  title="Cerrar chat"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={`chat-messages-container ${fondoChat}`}>
              {mensajes.length === 0 && contactoProvisional && (
                <div className="chat-placeholder-draft">
                  <p>Envía un primer mensaje a <b>{contactoProvisional.nombre}</b> para comenzar la conversación.</p>
                </div>
              )}

              {mensajes.map((m) => {
                const esMio = Boolean(miId && String(m.autorId) === String(miId));
                return (
                  <div
                    key={m.id}
                    className={`chat-message-row ${esMio ? 'mio' : 'otro'}`}
                  >
                    <div className={`chat-message-bubble ${esMio ? 'mio' : 'otro'}`}>
                      <div className="chat-message-text">{m.texto}</div>
                      <div className="chat-message-time">
                        {m.tempId
                          ? 'enviando…'
                          : m.fecha
                            ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {avisoChat && (
              <div role="alert" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#f87171' }}>
                {avisoChat}
              </div>
            )}

            <form onSubmit={manejarEnvio} className="chat-input-area">
              <input
                type="text"
                maxLength={2000}
                aria-label={`Mensaje para ${usuarioEnPantalla}`}
                placeholder={`Escribe un mensaje a ${usuarioEnPantalla}...`}
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="chat-send-button">
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Tus Mensajes</h3>
              <p style={{ maxWidth: '340px', margin: '0 auto', fontSize: '0.95rem' }}>
                Selecciona una conversación del lateral o pulsa <b>+ Nuevo</b> para escribirle a un contacto.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}