import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import GamePage from "./pages/game/GamePage.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import AdminLocations from "./pages/admin/AdminLocations.jsx";
import AdminActivities from "./pages/admin/AdminActivities.jsx";
import AdminCharacters from "./pages/admin/AdminCharacters.jsx";
import AdminGirlfriends from "./pages/admin/AdminGirlfriends.jsx";
import AdminUploads from "./pages/admin/AdminUploads.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/game" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/locations" replace />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="characters" element={<AdminCharacters />} />
          <Route path="girlfriends" element={<AdminGirlfriends />} />
          <Route path="uploads" element={<AdminUploads />} />
        </Route>
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
