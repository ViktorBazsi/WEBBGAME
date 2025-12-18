import TopNav from "./TopNav.jsx";

export default function AppLayout({ children, fullBleed = false }) {
  return (
    <div className={`min-h-screen bg-ink text-fog ${fullBleed ? "px-0" : ""}`}>
      <div className="fixed inset-0 -z-20 bg-grid-glow" />
      <TopNav />
      <main
        className={`mx-auto w-full ${fullBleed ? "max-w-none px-6" : "max-w-6xl px-6"} py-4 md:py-10 min-h-[calc(100vh-70px)]`}
      >
        {children}
      </main>
    </div>
  );
}
