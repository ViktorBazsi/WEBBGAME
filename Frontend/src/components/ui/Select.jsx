export default function Select({ label, className = "", children, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/70">
      {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
      <div className="relative">
        <select
          className={`w-full appearance-none rounded-full border border-white/10 bg-ink px-4 py-2 pr-10 text-white shadow-inner focus:border-mint focus:outline-none ${className}`}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/50">
          ▼
        </span>
      </div>
    </label>
  );
}
