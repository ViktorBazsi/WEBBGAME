export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{subtitle}</p>
        <h2 className="font-display text-2xl text-white">{title}</h2>
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}
