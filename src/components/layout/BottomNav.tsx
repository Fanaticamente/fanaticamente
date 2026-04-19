import { Home, Thermometer, Trophy, Newspaper } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppPages } from "@/hooks/useAppPages";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Thermometer, label: "Termômetro", path: "/diario" },
  { icon: Trophy, label: "Ranking", path: "/ranking" },
  { icon: Newspaper, label: "Futebol", path: "/futebol" },
];

const BottomNav = () => {
  const { data: pages } = useAppPages('mobile');

  const visibleItems = navItems.filter((item) => {
    if (!pages || pages.length === 0) return true;
    const page = pages.find((p) => p.path === item.path);
    return page ? page.is_visible !== false : true;
  });

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform">
      <nav className="glass-dark rounded-[32px] mx-auto max-w-md">
        <div className="flex items-center justify-around py-3 px-2">
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
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
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-8 h-1 bg-white rounded-full" />
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
