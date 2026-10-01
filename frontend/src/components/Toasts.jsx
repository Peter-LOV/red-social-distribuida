import '../styles/posts.css';

export function Toasts({ toasts }) {
  return (
    <div className="rs-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`rs-toast rs-toast--${t.tipo}`}>
          {t.mensaje}
        </div>
      ))}
    </div>
  );
}