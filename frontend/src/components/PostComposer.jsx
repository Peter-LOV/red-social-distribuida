import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import {
  MAX_IMAGEN_MB, MAX_TEXTO, TIPOS_IMAGEN, crearPost, mensajeAmigable,
} from '../services/posts';
import '../styles/posts.css';

// Formulario "¿Qué estás pensando?". onPublicado recibe el post creado; onMensaje(texto, tipo) muestra un toast.
export function PostComposer({ onPublicado, onMensaje }) {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [imagen, setImagen] = useState(null);
  const [vista, setVista] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inputArchivo = useRef(null);

  // Libera la vista previa anterior al cambiar o desmontar
  useEffect(() => () => vista && URL.revokeObjectURL(vista), [vista]);

  const vacio = texto.trim().length === 0;
  const excedido = texto.length > MAX_TEXTO;
  const puedePublicar = !vacio && !excedido && !enviando;

  const limpiar = () => {
    setTexto('');
    setImagen(null);
    setVista(null);
    if (inputArchivo.current) inputArchivo.current.value = '';
    setAbierto(false);
  };

  const cancelar = () => {
    if ((texto.trim() || imagen) && !window.confirm('¿Descartar esta publicación? Se perderá lo que escribiste.')) return;
    limpiar();
  };

  const elegirImagen = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      onMensaje('Solo puedes subir imágenes JPG, PNG, WEBP o GIF.', 'error');
      e.target.value = '';
      return;
    }
    if (archivo.size > MAX_IMAGEN_MB * 1024 * 1024) {
      onMensaje(`La imagen no puede pesar más de ${MAX_IMAGEN_MB} MB.`, 'error');
      e.target.value = '';
      return;
    }
    setImagen(archivo);
    setVista(URL.createObjectURL(archivo));
  };

  const quitarImagen = () => {
    setImagen(null);
    setVista(null);
    if (inputArchivo.current) inputArchivo.current.value = '';
  };

  const publicar = async (e) => {
    e.preventDefault();
    if (!puedePublicar) return;
    setEnviando(true);
    try {
      const post = await crearPost(texto.trim(), imagen);
      onPublicado(post);
      onMensaje('Tu publicación se creó correctamente.', 'ok');
      limpiar();
    } catch (err) {
      onMensaje(mensajeAmigable(err, 'No pudimos publicar. Intenta nuevamente.'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  const nombre = usuario?.nombre ?? '';
  const claseContador = excedido ? 'rs-contador--error' : texto.length > MAX_TEXTO - 50 ? 'rs-contador--aviso' : '';

  if (!abierto) {
    return (
      <section className="rs-tarjeta rs-composer">
        <button type="button" className="rs-composer-abrir" onClick={() => setAbierto(true)}>
          <Avatar nombre={nombre} tamano={40} />
          <span>¿Qué estás pensando{nombre ? `, ${nombre.split(' ')[0]}` : ''}?</span>
        </button>
      </section>
    );
  }

  return (
    <section className="rs-tarjeta rs-composer">
      <form onSubmit={publicar}>
        <div className="rs-composer-cabecera">
          <Avatar nombre={nombre} tamano={40} />
          <span>{nombre}</span>
        </div>

        <textarea
          className="rs-composer-texto"
          placeholder={'Escribe algo para compartir con tu red\u2026'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Texto de la publicación"
          disabled={enviando}
          autoFocus
        />

        {vista && (
          <div className="rs-composer-vista">
            <img src={vista} alt="Vista previa de la imagen seleccionada" />
            <button type="button" className="rs-composer-quitar" onClick={quitarImagen}
              aria-label="Quitar imagen" disabled={enviando}>
              {'\u2715'}
            </button>
          </div>
        )}

        <div className="rs-composer-pie">
          <div className="rs-composer-acciones">
            <input
              ref={inputArchivo}
              id="rs-archivo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="rs-oculto"
              onChange={elegirImagen}
              disabled={enviando}
            />
            <label
              htmlFor="rs-archivo"
              className="rs-boton rs-boton--fantasma"
              style={{ cursor: enviando ? 'not-allowed' : 'pointer' }}
            >
              <span aria-hidden="true">{'\u{1F4F7}'}</span> {imagen ? 'Cambiar foto' : 'Agregar foto'}
            </label>
            <span className={`rs-contador ${claseContador}`}>{texto.length}/{MAX_TEXTO}</span>
          </div>
          <div className="rs-composer-acciones">
            <button type="button" className="rs-boton rs-boton--fantasma" onClick={cancelar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="rs-boton rs-boton--primario" disabled={!puedePublicar}>
              {enviando ? 'Publicando\u2026' : 'Publicar'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}