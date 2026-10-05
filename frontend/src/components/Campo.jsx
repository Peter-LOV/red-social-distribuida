import { useState } from 'react';

// Campo de formulario. Si es de contraseña, trae el botón para verla u ocultarla.
export function Campo({ label, type = 'text', onTapar, ...resto }) {
  const [ver, setVer] = useState(false);
  const esClave = type === 'password';
  return (
    <label className="ui-campo">
      <span>{label}</span>
      <div className="ui-entrada">
        <input
          {...resto}
          type={esClave && ver ? 'text' : type}
          onFocus={() => esClave && onTapar?.(!ver)}
          onBlur={() => esClave && onTapar?.(false)}
          style={esClave ? { paddingRight: '4.5rem' } : undefined}
        />
        {esClave && (
          <button type="button" className="ui-ojo" onClick={() => { setVer((v) => !v); onTapar?.(false); }}>
            {ver ? 'Ocultar' : 'Ver'}
          </button>
        )}
      </div>
    </label>
  );
}