// Utilidades de formato para fechas y nombres

export function tiempoRelativo(iso) {
  const fecha = new Date(iso);
  const seg = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
  if (seg < 45) return 'hace un momento';
  if (seg < 3600) return `hace ${Math.max(1, Math.round(seg / 60))} min`;
  if (seg < 86400) return `hace ${Math.round(seg / 3600)} h`;
  if (seg < 2592000) {
    const dias = Math.round(seg / 86400);
    return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fechaCompleta(iso) {
  return new Date(iso).toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' });
}

export function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primera = partes[0][0];
  const segunda = partes.length > 1 ? partes[1][0] : '';
  return (primera + segunda).toUpperCase();
}