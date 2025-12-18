export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        fog: "#F3F5F7",
        ember: "#FF6A3D",
        mint: "#1DD3B0",
        steel: "#1D2A36",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(29,211,176,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,106,61,0.2), transparent 42%)",
      },
    },
  },
  plugins: [],
};
