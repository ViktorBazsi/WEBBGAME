export default function Input({ label, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/70">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <input
        className={`w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-mint focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
