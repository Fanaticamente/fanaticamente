import { Home, Thermometer, Newspaper, Shirt, Users, BookOpen, Radio, User, Settings, ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppMenu } from "@/hooks/useAppContent";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Thermometer,
  Newspaper,
  Shirt,
  Users,
  BookOpen,
  Radio,
  User,
  Settings,
  ShoppingBag,
};

// Static fallback menu - always used if database is empty
const fallbackItems = [
  { icon: "Home", label: "Início", path: "/" },
  { icon: "Thermometer", label: "Termômetro", path: "/diario" },
  { icon: "Newspaper", label: "Futebol", path: "/futebol" },
  { icon: "Shirt", label: "FanaticaShop", path: "/loja" },
];

const BottomNav = () => {
  const { data: menuData } = useAppMenu('bottom_nav');
  
  // Use database menu or fallback
  const navItems = menuData?.items && menuData.items.length > 0
    ? menuData.items
    : fallbackItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;