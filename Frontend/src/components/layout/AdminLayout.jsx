import { NavLink, Outlet } from "react-router-dom";
import AppLayout from "./AppLayout.jsx";

const links = [
  { to: "/admin/locations", label: "Locations" },
  { to: "/admin/activities", label: "Activities" },
  { to: "/admin/characters", label: "Characters" },
  { to: "/admin/girlfriends", label: "Girlfriends" },
  { to: "/admin/uploads", label: "Uploads" },
];

export default function AdminLayout() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-mint text-ink" : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </AppLayout>
  );
}
