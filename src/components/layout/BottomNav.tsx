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
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform font-sans">
      <nav className="glass-dark rounded-[32px] mx-auto max-w-md">
        <div className="flex items-center justify-around py-3 px-1">
          {visibleItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 py-2 px-1 min-w-[56px] rounded-xl transition-all ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-muted-foreground hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <IconComponent
                      className={`w-6 h-6 transition-transform ${
                        isActive ? "scale-110" : ""
                      }`}
                    />
                    <span className="text-[10.5px] font-medium">{item.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-0.5 w-6 h-1 bg-white rounded-full" />
                    )}
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
