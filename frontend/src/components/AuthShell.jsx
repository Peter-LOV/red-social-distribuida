import { useState } from 'react';
import { Mascota } from './Mascota';
import '../styles/shell.css';

// Marco común de login y registro: fondo con degradado, mascota y tarjeta de cristal
export function AuthShell({ titulo, subtitulo, tapando, children }) {
  const [mira, setMira] = useState({ x: 0, y: 0 });
  const mover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMira({
      x: Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - (r.top + 120)) / 300)),
    });
  };
  return (
    <main className="ui-auth" onMouseMove={mover}>
      <div className="ui-auth-caja">
        <Mascota mira={mira} tapando={tapando} />
        <section className="ui-tarjeta">
          <h1 className="ui-titulo">{titulo}</h1>
          <p className="ui-sub">{subtitulo}</p>
          {children}
        </section>
      </div>
    </main>
  );
}