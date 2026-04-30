import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Plus, Megaphone, User } from "lucide-react";
import { useApp } from "../contexts/AppContext";

// ─── BottomNav — OCP: extend nav items without modifying this component ────────

const NAV_ITEMS = [
  { path: "/home", icon: Home, label: "Inicio", isCreate: false },
  { path: "/explore", icon: Search, label: "Explorar", isCreate: false },
  { path: "/create-request", icon: Plus, label: "", isCreate: true },
  { path: "/campaigns", icon: Megaphone, label: "Campañas", isCreate: false },
  { path: "/profile", icon: User, label: "Perfil", isCreate: false },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav-safe fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-app-bg/95 backdrop-blur-md border-t border-app-border/10 z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.isCreate) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blood-600 to-blood-700 flex items-center justify-center shadow-lg shadow-blood-600/40 active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1 min-w-[56px] active:scale-95 transition-transform"
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${
                isActive ? "text-blood-500" : "text-app-text/40"
              }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-blood-500" : "text-app-text/40"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blood-500 absolute bottom-2" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
