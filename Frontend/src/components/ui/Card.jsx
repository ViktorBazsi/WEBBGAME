export default function Card({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow ${className}`}>{children}</div>
  );
}
