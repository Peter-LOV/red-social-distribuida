// Pantalla de detalle de post - será completada por Persona B
import { useParams } from 'react-router-dom';

export function Post() {
  const { id } = useParams();

  return (
    <div style={styles.container}>
      <h1>Post {id}</h1>
      <p>Esta pantalla será completada por Persona B.</p>
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
