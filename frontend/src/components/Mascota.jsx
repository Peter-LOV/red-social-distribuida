// Mascota "nodo" de la red: sus ojos siguen el cursor y se tapa la cara al escribir la contraseña
export function Mascota({ mira = { x: 0, y: 0 }, tapando = false }) {
  const ojo = (cx) => (
    <g>
      <circle cx={cx} cy="62" r="11" fill="#fff" />
      <circle cx={cx + mira.x * 4} cy={62 + mira.y * 4} r="5" fill="#0b1020" />
    </g>
  );
  return (
    <svg className="ui-mascota" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="gm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M22 36 L30 8 L52 28 Z M98 36 L90 8 L68 28 Z" fill="#4f46e5" />
      <circle cx="60" cy="66" r="44" fill="url(#gm)" />
      <circle cx="30" cy="76" r="7" fill="#f472b6" opacity=".5" />
      <circle cx="90" cy="76" r="7" fill="#f472b6" opacity=".5" />
      {ojo(43)}
      {ojo(77)}
      <path d="M50 88 Q60 96 70 88" stroke="#0b1020" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g style={{ transition: 'transform .25s, opacity .25s', opacity: tapando ? 1 : 0, transform: tapando ? 'translateY(0)' : 'translateY(70px)' }}>
        <ellipse cx="43" cy="64" rx="16" ry="14" fill="#312e81" />
        <ellipse cx="77" cy="64" rx="16" ry="14" fill="#312e81" />
      </g>
    </svg>
  );
}