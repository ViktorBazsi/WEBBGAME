import { Link, NavLink } from "react-router-dom";
import Button from "../ui/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `text-sm uppercase tracking-[0.2em] ${isActive ? "text-mint" : "text-white/60 hover:text-white"}`
    }
  >
    {children}
  </NavLink>
);

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/game" className="font-display text-xl text-white">
          WebGame
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavItem to="/game">Game</NavItem>
          {user?.role === "ADMIN" ? <NavItem to="/admin">Dashboard</NavItem> : null}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="ghost">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
