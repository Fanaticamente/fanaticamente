import { Home, FlaskConical, Building2, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/profissional" },
  { icon: FlaskConical, label: "FanaticaLab", path: "/fanatica-lab" },
  { icon: Building2, label: "Psi House", path: "/psi-house" },
  { icon: Users, label: "Conecta", path: "/conecta" },
];

const ProfessionalBottomNav = () => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform">
      <nav className="bg-white/95 backdrop-blur-lg border border-gray-200 shadow-lg rounded-[32px] mx-auto max-w-md">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-500 hover:text-primary"
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
                      <div className="absolute -bottom-0.5 w-8 h-1 bg-primary rounded-full" />
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

export default ProfessionalBottomNav;
