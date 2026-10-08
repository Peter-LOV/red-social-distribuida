import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Campo } from '../components/Campo';
import { mensajeAmigable } from '../services/posts';

export function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tapando, setTapando] = useState(false);
  const { registro } = useAuth();
  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setCargando(true);
    try {
      await registro(nombre, email, password);
      navigate('/');
    } catch (err) {
      setError(mensajeAmigable(err, 'No pudimos crear la cuenta. Intenta nuevamente.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell titulo="Crea tu cuenta" subtitulo="Únete y conecta con personas como tú." tapando={tapando}>
      {error && <div className="ui-error" role="alert">{error}</div>}
      <form onSubmit={enviar}>
        <Campo label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
          autoComplete="name" placeholder="¿Cómo te llamas?" required />
        <Campo label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" placeholder="tu@correo.com" required />
        <Campo label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" placeholder="Mínimo 6 caracteres" onTapar={setTapando} required />
        <button type="submit" className="ui-boton" disabled={cargando}>{cargando ? 'Creando\u2026' : 'Crear cuenta'}</button>
      </form>
      <p className="ui-pie">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </AuthShell>
  );
}