import { Home, Thermometer, Newspaper, Shirt } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Thermometer, label: "Termômetro", path: "/diario" },
  { icon: Newspaper, label: "Futebol", path: "/futebol" },
  { icon: Shirt, label: "FanaticaShop", path: "/loja" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-6 h-6 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-0.5 w-8 h-1 bg-primary rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
