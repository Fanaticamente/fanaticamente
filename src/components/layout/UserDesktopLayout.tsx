import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  User, 
  Calendar, 
  BookOpen, 
  CreditCard,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DesktopHeader from "@/components/desktop/DesktopHeader";

interface UserDesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: User, label: "Meu Perfil", path: "/perfil" },
  { icon: Calendar, label: "Meus Agendamentos", path: "/meus-agendamentos" },
  { icon: BookOpen, label: "Meus Cursos", path: "/cursos" },
  { icon: CreditCard, label: "Pagamentos", path: "/pagamentos" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const UserDesktopLayout = ({ children, title, subtitle }: UserDesktopLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <DesktopHeader />

      <div className="flex flex-1 pt-[72px]">
        {/* Sidebar */}
        <aside className="fixed left-0 top-[72px] bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30">
          {/* User Profile Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Avatar className="h-10 w-10 border-2 border-emerald-500">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name?.split(" ")[0] || "Torcedor"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${active ? "text-emerald-600" : "text-gray-500"}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-emerald-600" />}
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
            <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-[72px] z-20">
              <div className="max-w-5xl">
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDesktopLayout;
