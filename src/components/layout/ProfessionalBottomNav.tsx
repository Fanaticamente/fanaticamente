import { Home, CalendarCheck, CreditCard, UserCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/profissional", tab: null },
  { icon: CalendarCheck, label: "Agendamentos", path: "/profissional?tab=agenda", tab: "agenda" },
  { icon: CreditCard, label: "Assinatura", path: "/profissional?tab=assinatura", tab: "assinatura" },
  { icon: UserCircle, label: "Perfil", path: "/profissional?tab=perfil", tab: "perfil" },
];

const ProfessionalBottomNav = () => {
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get("tab");

  const isItemActive = (item: typeof navItems[0]) => {
    if (location.pathname !== "/profissional") return false;
    if (item.tab === null) return !currentTab;
    return currentTab === item.tab;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform">
      <nav className="bg-white/95 backdrop-blur-lg border border-gray-200 shadow-lg rounded-[32px] mx-auto max-w-md">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isItemActive(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-primary"
                }`}
              >
                <IconComponent
                  className={`w-6 h-6 transition-transform ${
                    active ? "scale-110" : ""
                  }`}
                />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -bottom-0.5 w-8 h-1 bg-primary rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ProfessionalBottomNav;
