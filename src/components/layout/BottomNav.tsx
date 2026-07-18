import { Home, Heart, Users, CircleDot, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppPages } from "@/hooks/useAppPages";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Heart, label: "Bem-estar", path: "/bem-estar" },
  { icon: Users, label: "Comunidade", path: "/ranking" },
  { icon: CircleDot, label: "Futebol", path: "/futebol" },
  { icon: User, label: "Você", path: "/perfil" },
];

const BottomNav = () => {
  const { data: pages } = useAppPages('mobile');

  const visibleItems = navItems.filter((item) => {
    if (!pages || pages.length === 0) return true;
    const page = pages.find((p) => p.path === item.path);
    return page ? page.is_visible !== false : true;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform font-sans">
      <nav className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-xl transition-all ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <IconComponent
                    className={`w-6 h-6 transition-transform ${
                      isActive ? "scale-110 fill-emerald-600" : ""
                    }`}
                  />
                  <span className="text-[10.5px] font-semibold">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
