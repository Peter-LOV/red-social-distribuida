
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { activarNotificaciones } from '../push';
import { Avatar } from './Avatar';
import { useTema } from '../hooks/useTema';
import { api } from '../api/client';
import '../styles/shell.css';

const ICONO = {
  inicio: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  personas: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  grafo: 'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8v4M12 12l-6 4M12 12l6 4',
};

const ENLACES = [
  ['/', 'Inicio', 'inicio'],
  ['/sugerencias', 'Personas', 'personas'],
  ['/grafo', 'Grafo', 'grafo'],
  ['/chat', 'Chat', 'chat'],
];

function Icono({ d }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tema, alternarTema] = useTema();
  const [hayChatsPendientes, setHayChatsPendientes] = useState(false);

  const miId = usuario?.id;
  const enChat = location.pathname === '/chat';

  // Determina si existe alguna conversación con mensajes
  // recibidos que todavía no se han leído.
  const verificarPendientes = useCallback(async () => {
    if (!miId) {
      setHayChatsPendientes(false);
      return;
    }

    try {
      const convs = await api('/chat/conversaciones');

      let vistos = {};

      try {
        vistos = JSON.parse(
          localStorage.getItem(`synapse_chat_vistos_${miId}`) || '{}'
        );
      } catch {
        vistos = {};
      }

      const pendiente = (convs || []).some((conv) => {
        if (!conv.ultimoMensajeId || !conv.ultimoTexto) {
          return false;
        }

        // Un mensaje propio no genera una notificación de no leído.
        if (String(conv.ultimoAutorId) === String(miId)) {
          return false;
        }

        // Se compara el ID, nunca la hora del mensaje.
        return (
          String(vistos[conv.id] ?? '') !==
          String(conv.ultimoMensajeId)
        );
      });

      setHayChatsPendientes(pendiente);
    } catch (err) {
      console.error('Error verificando mensajes pendientes:', err);
    }
  }, [miId]);

  // Comprobar al entrar en una ruta y cuando Chat informa
  // de un cambio en el estado de lectura.
  useEffect(() => {
    verificarPendientes();

    window.addEventListener(
      'chat:status-changed',
      verificarPendientes
    );

    return () => {
      window.removeEventListener(
        'chat:status-changed',
        verificarPendientes
      );
    };
  }, [verificarPendientes, location.pathname]);

  // El WebSocket de la barra funciona fuera de Chat.
  // Dentro de Chat, el propio componente Chat recibe los mensajes.
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !miId || enChat) {
      return;
    }

    let ws = null;
    let timer = null;
    let activo = true;

    const conectar = () => {
      if (!activo) return;

      try {
        ws = new WebSocket(
          `ws://localhost:8080/ws/chat?token=${encodeURIComponent(token)}`
        );
      } catch (err) {
        console.error('Error creando WebSocket de navegación:', err);
        return;
      }

      ws.onmessage = (evento) => {
        try {
          const payload = JSON.parse(evento.data);

          if (
            payload.tipo === 'mensaje' &&
            String(payload.autorId) !== String(miId)
          ) {
            // Respuesta inmediata: el punto aparece sin recargar.
            setHayChatsPendientes(true);
          }
        } catch (err) {
          console.error('Error procesando mensaje de navegación:', err);
        }
      };

      ws.onclose = () => {
        if (activo) {
          timer = setTimeout(conectar, 1500);
        }
      };

      ws.onerror = () => {
        // onclose se encarga de intentar la reconexión.
        if (ws?.readyState !== WebSocket.CLOSED) {
          ws?.close();
        }
      };
    };

    conectar();

    return () => {
      activo = false;
      clearTimeout(timer);

      if (ws) {
        ws.close();
      }
    };
  }, [miId, enChat]);

  if (!usuario) return null;

  const salir = () => {
    logout();
    navigate('/login');
  };

  const notificar = async () => {
    const ok = await activarNotificaciones();

    alert(
      ok
        ? 'Notificaciones activadas correctamente'
        : 'No se pudieron activar las notificaciones.'
    );
  };

  const enlaces = (extra) =>
    ENLACES.map(([ruta, texto, icono]) => {
      const esChat = ruta === '/chat';

      // El punto se oculta dentro de Chat, pero eso no
      // marca automáticamente las conversaciones como leídas.
      const mostrarPunto =
        esChat && hayChatsPendientes && !enChat;

      return (
        <NavLink
          key={ruta}
          to={ruta}
          end={ruta === '/'}
          className={({ isActive }) =>
            `ui-enlace${isActive ? ' activo' : ''}`
          }
          style={{ position: 'relative' }}
        >
          <Icono d={ICONO[icono]} />

          {extra ? <span>{texto}</span> : texto}

          {mostrarPunto && (
            <span
              aria-label="Tienes mensajes sin leer"
              style={{
                position: 'absolute',
                top: '6px',
                right: '4px',
                width: '9px',
                height: '9px',
                backgroundColor: '#38bdf8',
                borderRadius: '50%',
                boxShadow: '0 0 10px #38bdf8',
              }}
            />
          )}
        </NavLink>
      );
    });

  return (
    <>
      <header className="ui-cabecera">
        <div className="ui-cabecera-in">
          <Link to="/" className="ui-logo">
            <img src="/logo.svg" alt="" />
            <span>Synapse</span>
          </Link>

          <nav className="ui-links">{enlaces(false)}</nav>

          <div className="ui-acciones">
            <span className="ui-usuario">
              <Avatar nombre={usuario.nombre} tamano={28} />
              {' '}
              {usuario.nombre}
            </span>

            <button className="ui-mini" onClick={alternarTema}>
              {tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
            </button>

            <button className="ui-mini" onClick={notificar}>
              Notificaciones
            </button>

            <button className="ui-mini" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav className="ui-tabs" aria-label="Navegación principal">
        {enlaces(true)}
      </nav>
    </>
  );
}