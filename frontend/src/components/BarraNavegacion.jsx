import { useEffect, useState } from 'react';
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}

export function BarraNavegacion() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tema, alternarTema] = useTema();
  const [hayMensajeNuevo, setHayMensajeNuevo] = useState(false);

  // 1. Revisar si hay mensajes pendientes en backend al cargar o iniciar sesión
  useEffect(() => {
    if (!usuario) return;

    async function verificarMensajesPendientes() {
      try {
        const conversaciones = await api('/chat/conversaciones');
        const vistos = JSON.parse(localStorage.getItem(`chat_vistos_${usuario.id}`) || '{}');

        const tienePendientes = (conversaciones || []).some((conv) => {
          if (!conv.ultimaFecha) return false;
          const ultimaVisita = vistos[conv.id];
          return !ultimaVisita || new Date(conv.ultimaFecha) > new Date(ultimaVisita);
        });

        if (tienePendientes && location.pathname !== '/chat') {
          setHayMensajeNuevo(true);
        }
      } catch (err) {
        console.error('Error verificando mensajes pendientes:', err);
      }
    }

    verificarMensajesPendientes();
  }, [usuario, location.pathname]);

  // 2. Limpiar el indicador al entrar a la pantalla /chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      setHayMensajeNuevo(false);
    }
  }, [location.pathname]);

  // 3. Socket en segundo plano para encender el aviso si el usuario está en otra ruta
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !usuario || location.pathname === '/chat') return;

    const ws = new WebSocket(`ws://localhost:8080/ws/chat?token=${token}`);
    ws.onmessage = (evento) => {
      try {
        const payload = JSON.parse(evento.data);
        if (payload.tipo === 'mensaje' && String(payload.autorId) !== String(usuario.id)) {
          setHayMensajeNuevo(true);
        }
      } catch (err) {
        console.error('Error en socket de barra de navegación:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [usuario?.id, location.pathname]);

  if (!usuario) return null;

  const salir = () => {
    logout();
    navigate('/login');
  };

  const notificar = async () => {
    const ok = await activarNotificaciones();
    alert(ok ? 'Notificaciones activadas correctamente' : 'No se pudieron activar las notificaciones. Verifica que tu navegador las soporte.');
  };

  const enlaces = (extra) =>
    ENLACES.map(([a, texto, icono]) => {
      const esChat = a === '/chat';
      return (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          className={({ isActive }) => `ui-enlace${isActive ? ' activo' : ''}`}
          style={{ position: 'relative' }}
        >
          <Icono d={ICONO[icono]} />
          {extra ? <span>{texto}</span> : texto}
          {esChat && hayMensajeNuevo && (
            <span
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
              <Avatar nombre={usuario.nombre} tamano={28} /> {usuario.nombre}
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