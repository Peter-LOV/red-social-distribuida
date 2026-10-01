// Pantalla de perfil - será completada por Persona A
import { useParams } from 'react-router-dom';

export function Perfil() {
  const { id } = useParams();

  return (
    <div style={styles.container}>
      <h1>Perfil {id}</h1>
      <p>Esta pantalla será completada por Persona A.</p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
};
