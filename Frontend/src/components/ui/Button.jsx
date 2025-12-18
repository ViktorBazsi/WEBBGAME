const variants = {
  primary:
    "bg-ember text-ink hover:bg-[#ff7b54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember",
  ghost:
    "bg-transparent text-fog hover:bg-white/5 border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
  subtle:
    "bg-white/10 text-fog hover:bg-white/15 border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
};

export default function Button({ as: Comp = "button", variant = "primary", className = "", ...props }) {
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
        variants[variant]
      } ${className}`}
      {...props}
    />
  );
}
