import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="py-20 text-center text-white/60">Betoltes...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/game" replace />;
  }

  return children;
}
