import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Campo } from '../components/Campo';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tapando, setTapando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof TypeError ? 'No pudimos conectar con el servidor. Intenta nuevamente.' : err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell titulo="Bienvenido de nuevo" subtitulo="Entra a Synapse y conecta con tu red." tapando={tapando}>
      {error && <div className="ui-error" role="alert">{error}</div>}
      <form onSubmit={enviar}>
        <Campo label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" placeholder="tu@correo.com" required />
        <Campo label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" placeholder="Tu contraseña" onTapar={setTapando} required />
        <button type="submit" className="ui-boton" disabled={cargando}>{cargando ? 'Entrando\u2026' : 'Iniciar sesión'}</button>
      </form>
      <p className="ui-pie">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
    </AuthShell>
  );
}