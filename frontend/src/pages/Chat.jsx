import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import '../styles/Chat.css';

export function Chat() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargandoConv, setCargandoConv] = useState(true);

  // Estados para nuevo chat
  const [vistaNuevoChat, setVistaNuevoChat] = useState(false);
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [tabContactos, setTabContactos] = useState('seguidores');
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [contactoProvisional, setContactoProvisional] = useState(null);

  // Referencias para evitar desincronización por closures en WebSocket
  const conversacionActivaRef = useRef(null);
  const miIdRef = useRef(null);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  // Resolver identidad del usuario autenticado
  const token = localStorage.getItem('token');
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('user') || '{}');
  
  let miId = usuarioGuardado.id || usuarioGuardado.sub;
  if (!miId && token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      miId = decoded.sub || decoded.upn || decoded.id;
    } catch (e) {
      console.error('Error decodificando token:', e);
    }
  }

  // Sincronizar referencias con el estado más reciente
  useEffect(() => {
    conversacionActivaRef.current = conversacionActiva;
  }, [conversacionActiva]);

  useEffect(() => {
    miIdRef.current = miId;
  }, [miId]);

  const STORAGE_KEY_VISTOS = `chat_vistos_${miId}`;

  const obtenerVistos = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || '{}');
    } catch {
      return {};
    }
  };

  const marcarComoVistoEnStorage = (convId, fecha) => {
    if (!convId) return;
    const vistos = obtenerVistos();
    vistos[convId] = fecha || new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(vistos));
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

      const listaProcesada = (datos || []).map((conv) => {
        let noLeido = false;
        if (conv.ultimaFecha) {
          const ultimaVisita = vistos[conv.id];
          noLeido = !ultimaVisita || new Date(conv.ultimaFecha) > new Date(ultimaVisita);
        }
        return { ...conv, noLeido };
      });

      setConversaciones(listaProcesada);

      if (idParaActivar) {
        const encontrada = listaProcesada.find((c) => c.id === idParaActivar);
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

  // 2. Conectar y reconectar automáticamente el WebSocket
  const conectarWebSocket = () => {
    if (!token) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `ws://localhost:8080/ws/chat?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (evento) => {
      try {
        const payload = JSON.parse(evento.data);
        if (payload.tipo === 'mensaje') {
          const idChatAbierto = conversacionActivaRef.current?.id;
          const estaEnEstaConversacion = idChatAbierto === payload.conversacionId;
          const idActual = miIdRef.current;

          // Si el chat está abierto, agregar o sustituir el temporal
          if (estaEnEstaConversacion) {
            setMensajes((prev) => {
              const existe = prev.some(
                (m) => String(m.id) === String(payload.id) || (m.tempId && m.texto === payload.texto)
              );
              if (existe) {
                return prev.map((m) => (m.tempId && m.texto === payload.texto ? payload : m));
              }
              return [...prev, payload];
            });
            marcarComoVistoEnStorage(payload.conversacionId, payload.fecha);
          }

          // Actualizar barra lateral
          setConversaciones((prev) => {
            const existe = prev.some((c) => c.id === payload.conversacionId);
            if (existe) {
              return prev.map((c) => {
                if (c.id === payload.conversacionId) {
                  const esMio = String(payload.autorId) === String(idActual);
                  return {
                    ...c,
                    ultimoTexto: payload.texto,
                    ultimaFecha: payload.fecha,
                    noLeido: !estaEnEstaConversacion && !esMio,
                  };
                }
                return c;
              });
            } else {
              cargarConversaciones(estaEnEstaConversacion ? payload.conversacionId : null);
              return prev;
            }
          });
        }
      } catch (err) {
        console.error('Error procesando socket message:', err);
      }
    };

    ws.onclose = () => {
      // Reconectar si se cerró por inactividad
      setTimeout(() => {
        if (token) conectarWebSocket();
      }, 1500);
    };
  };

  useEffect(() => {
    conectarWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // 3. Abrir conversación existente
  async function seleccionarConversacion(conv) {
    setVistaNuevoChat(false);
    setContactoProvisional(null);

    marcarComoVistoEnStorage(conv.id, conv.ultimaFecha || new Date().toISOString());
    setConversaciones((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, noLeido: false } : c))
    );

    setConversacionActiva(conv);
    try {
      const historial = await api(`/chat/conversaciones/${conv.id}/mensajes`);
      setMensajes(historial || []);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }

  // 4. Enviar mensaje de inmediato con reconexión reactiva
  async function manejarEnvio(e) {
    e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto) return;

    let convId = conversacionActiva?.id;

    // Crear conversación si es borrador inicial
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
          noLeido: false,
        };

        marcarComoVistoEnStorage(convId, nuevaConv.ultimaFecha);
        setConversacionActiva(nuevaConv);
        setConversaciones((prev) => [nuevaConv, ...prev.filter((c) => c.id !== convId)]);
        setContactoProvisional(null);
      } catch (err) {
        alert(err.message || 'Error al iniciar la conversación');
        return;
      }
    }

    if (!convId) return;

    // Pintar de inmediato en la pantalla del emisor (Optimistic UI)
    const mensajeOptimista = {
      id: `temp-${Date.now()}`,
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
          ? { ...c, ultimoTexto: texto, ultimaFecha: mensajeOptimista.fecha, noLeido: false }
          : c
      )
    );

    const despacharSocket = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            conversacionId: convId,
            texto: texto,
          })
        );
      }
    };

    // Si el socket se desconectó por reposo, reconectarlo y despachar
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      conectarWebSocket();
      setTimeout(despacharSocket, 300);
    } else {
      despacharSocket();
    }
  }

  // 5. Selector de nuevos contactos
  async function abrirNuevoChat() {
    setConversacionActiva(null);
    setContactoProvisional(null);
    setVistaNuevoChat(true);
    setCargandoContactos(true);
    try {
      const [segdores, segdos] = await Promise.all([
        api(`/social/seguidores/${miId}`).catch(() => api(`/usuarios/${miId}/seguidores`).catch(() => [])),
        api(`/social/seguidos/${miId}`).catch(() => api(`/usuarios/${miId}/seguidos`).catch(() => [])),
      ]);

      setSeguidores(Array.isArray(segdores) ? segdores : []);
      setSiguiendo(Array.isArray(segdos) ? segdos : []);
    } catch (err) {
      console.error('Error cargando contactos:', err);
    } finally {
      setCargandoContactos(false);
    }
  }

  function prepararChatConUsuario(contacto) {
    setVistaNuevoChat(false);
    const existente = conversaciones.find((c) => String(c.otroId) === String(contacto.id));
    if (existente) {
      seleccionarConversacion(existente);
    } else {
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
          <h2 className="chat-sidebar-title">Mensajes</h2>
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
                    onClick={() => seleccionarConversacion(conv)}
                    className={`chat-conv-item ${activa ? 'active' : ''} ${conv.noLeido ? 'unopened' : ''}`}
                  >
                    <div className="chat-avatar">
                      {conv.otroNombre ? conv.otroNombre.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="chat-conv-meta">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`chat-conv-nombre ${conv.noLeido ? 'unread-title' : ''}`}>
                          {conv.otroNombre}
                        </span>
                        {conv.noLeido && <span className="chat-unread-dot" title="Mensaje no leído" />}
                      </div>
                      <div className={`chat-conv-preview ${conv.noLeido ? 'unread' : ''}`}>
                        {conv.ultimoTexto || 'Conversación iniciada'}
                      </div>
                    </div>
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
                    onClick={() => prepararChatConUsuario(contacto)}
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
            <div className="chat-header">
              <div className="chat-avatar">
                {usuarioEnPantalla?.charAt(0).toUpperCase()}
              </div>
              <span className="chat-header-name">{usuarioEnPantalla}</span>
            </div>

            <div className="chat-messages-container">
              {mensajes.length === 0 && contactoProvisional && (
                <div className="chat-placeholder-draft">
                  <p>Envía un primer mensaje a <b>{contactoProvisional.nombre}</b> para comenzar la conversación.</p>
                </div>
              )}

              {mensajes.map((m) => {
                const esMio = Boolean(miId && String(m.autorId) === String(miId));
                return (
                  <div
                    key={m.id || `${m.fecha}-${Math.random()}`}
                    className={`chat-message-row ${esMio ? 'mio' : 'otro'}`}
                  >
                    <div className={`chat-message-bubble ${esMio ? 'mio' : 'otro'}`}>
                      <div className="chat-message-text">{m.texto}</div>
                      <div className="chat-message-time">
                        {m.fecha
                          ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={manejarEnvio} className="chat-input-area">
              <input
                type="text"
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
              <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '1.4rem' }}>Tus Mensajes</h3>
              <p style={{ color: '#64748b', maxWidth: '340px', margin: '0 auto', fontSize: '0.95rem' }}>
                Selecciona una conversación del lateral o pulsa <b>+ Nuevo</b> para escribirle a un contacto.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}