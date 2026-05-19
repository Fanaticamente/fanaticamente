import { useNavigate, useLocation } from "react-router-dom";
import { Home, CalendarCheck, CreditCard, UserCircle, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DesktopHeader from "@/components/desktop/DesktopHeader";

interface ProfessionalDesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { icon: Home, label: "Início", path: "/profissional", tab: null },
  { icon: CalendarCheck, label: "Agendamentos", path: "/profissional?tab=agenda", tab: "agenda" },
  { icon: CreditCard, label: "Assinatura", path: "/profissional?tab=assinatura", tab: "assinatura" },
  { icon: UserCircle, label: "Perfil", path: "/profissional?tab=perfil", tab: "perfil" },
];

const ProfessionalDesktopLayout = ({ children, title, subtitle }: ProfessionalDesktopLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["professional-profile", user?.id],
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
    navigate("/profissional/auth", { replace: true });
  };

  const isActive = (item: typeof navItems[0]) => {
    if (location.pathname !== "/profissional") return false;
    const currentTab = new URLSearchParams(location.search).get("tab");
    if (item.tab === null) return !currentTab;
    return currentTab === item.tab;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "P";
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
          {/* Professional Profile Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-white text-sm font-medium">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name?.split(" ")[0] || "Profissional"}
                </p>
                <p className="text-xs text-primary truncate">
                  Painel Profissional
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item);
              
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
            <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-[72px] z-20">
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
    </div>
  );
};

export default ProfessionalDesktopLayout;
