export default function FileInput({ label, onChange, fileName, accept = "image/*" }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 text-sm text-white/70">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-mint/40 hover:bg-white/10">
        <span className="text-xs uppercase tracking-[0.2em] text-mint">Fajl</span>
        <span className="text-xs text-white/60">{fileName || "Nincs kivalasztva"}</span>
      </div>
      <input type="file" accept={accept} onChange={onChange} className="hidden" />
    </label>
  );
}
