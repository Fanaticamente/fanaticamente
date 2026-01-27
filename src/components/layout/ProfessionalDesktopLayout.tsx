import { useNavigate, useLocation } from "react-router-dom";
import { Home, FlaskConical, Building2, Users, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoLight from "@/assets/admin-logo-light.png";

interface ProfessionalDesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { icon: Home, label: "Início", path: "/profissional" },
  { icon: FlaskConical, label: "FanaticaLab", path: "/fanatica-lab" },
  { icon: Building2, label: "Psi House", path: "/psi-house" },
  { icon: Users, label: "Conecta", path: "/conecta" },
];

const ProfessionalDesktopLayout = ({ children, title, subtitle }: ProfessionalDesktopLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/profissional") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <img 
            src={logoLight} 
            alt="Fanaticamente" 
            className="h-10 w-auto cursor-pointer" 
            onClick={() => navigate("/profissional")}
          />
          <p className="text-xs text-gray-500 mt-2">Painel Profissional</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <IconComponent className={`w-5 h-5 ${active ? "text-primary" : "text-gray-500"}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Header */}
        {(title || subtitle) && (
          <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-30">
            <div className="max-w-6xl">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8">
          <div className="max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalDesktopLayout;
