export default function ModalBase({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ink/95 p-6 shadow-glow">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 transition hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 text-sm text-white/70">{children}</div>
        <div className="mt-6 flex justify-end gap-3">{actions}</div>
      </div>
    </div>
  );
}
