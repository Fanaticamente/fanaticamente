import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Users, UserCheck, Calendar, Settings, LogOut, Search, Filter, 
  Shield, Sun, Moon, LayoutDashboard, DollarSign, ClipboardList, Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import adminLogoLight from "@/assets/admin-logo-light.png";
import adminLogoDark from "@/assets/admin-logo-dark.png";
import AdminMetricsDashboard from "@/components/admin/AdminMetricsDashboard";
import AdminFinanceDashboard from "@/components/admin/AdminFinanceDashboard";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminProfessionalsTable from "@/components/admin/AdminProfessionalsTable";
import AdminProfessionalsManagement from "@/components/admin/AdminProfessionalsManagement";
import AdminAppointmentsTable from "@/components/admin/AdminAppointmentsTable";
import AdminNotifications from "@/components/admin/AdminNotifications";

type TabType = "dashboard" | "financeiro" | "usuarios" | "gestao" | "profissionais" | "agendamentos" | "notificacoes" | "configuracoes";

const AdminDashboard = () => {
  const { user, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Valid tabs
  const validTabs: TabType[] = ["dashboard", "financeiro", "usuarios", "gestao", "profissionais", "agendamentos", "notificacoes", "configuracoes"];
  
  // Get tab from URL or default
  const getTabFromUrl = (): TabType => {
    const urlTab = searchParams.get("tab") as TabType | null;
    return urlTab && validTabs.includes(urlTab) ? urlTab : "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync activeTab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = getTabFromUrl();
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Sync URL when tab changes via click
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Wait for loading to complete before checking role
  useEffect(() => {
    if (!loading && !hasRole("admin")) {
      navigate("/");
      return;
    }
  }, [hasRole, navigate, loading]);

  // Show nothing while loading to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/admin-access");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Theme-based styles
  const themeStyles = isDarkMode ? {
    bg: "bg-[#1a1a1a]",
    sidebar: "bg-[#0d0d0d]",
    card: "bg-[#252525]",
    text: "text-white",
    textMuted: "text-gray-400",
    border: "border-[#333]",
    inputBg: "bg-[#1a1a1a]",
    hoverBg: "hover:bg-[#333]",
    tableBg: "bg-[#1a1a1a]"
  } : {
    bg: "bg-gray-50",
    sidebar: "bg-white",
    card: "bg-white",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    inputBg: "bg-white",
    hoverBg: "hover:bg-gray-100",
    tableBg: "bg-gray-50"
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "gestao", label: "Gestão", icon: ClipboardList },
    { id: "profissionais", label: "Profissionais", icon: UserCheck },
    { id: "agendamentos", label: "Agendamentos", icon: Calendar },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${themeStyles.bg}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 ${themeStyles.sidebar} border-r ${themeStyles.border} hidden md:block`}>
        <div className="p-6 flex items-center justify-between">
          <img 
            src={isDarkMode ? adminLogoDark : adminLogoLight} 
            alt="Fanatica Mente" 
            className="h-8 object-contain"
          />
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${themeStyles.hoverBg} transition-colors`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        <p className={`px-6 -mt-3 mb-4 ${themeStyles.textMuted} text-sm`}>Painel Administrativo</p>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id
                  ? "bg-secondary text-secondary-foreground"
                  : `${themeStyles.textMuted} ${themeStyles.hoverBg}`
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${themeStyles.border}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${themeStyles.text} text-sm font-medium truncate`}>Admin</p>
              <p className={`${themeStyles.textMuted} text-xs truncate`}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 ${themeStyles.textMuted} ${themeStyles.hoverBg} transition-colors rounded-lg`}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6">
        {/* Search Bar - only show for tables */}
        {(activeTab === "usuarios" || activeTab === "profissionais" || activeTab === "agendamentos") && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeStyles.textMuted}`} />
              <input
                type="text"
                name="admin_search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${themeStyles.inputBg} border ${themeStyles.border} rounded-xl ${themeStyles.text} focus:border-secondary focus:outline-none`}
              />
            </div>
            <button className={`p-3 ${themeStyles.card} border ${themeStyles.border} rounded-xl hover:border-secondary transition-colors`}>
              <Filter className={`w-5 h-5 ${themeStyles.textMuted}`} />
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <AdminMetricsDashboard themeStyles={themeStyles} isDarkMode={isDarkMode} />
        )}

        {/* Financeiro Tab */}
        {activeTab === "financeiro" && (
          <AdminFinanceDashboard themeStyles={themeStyles} isDarkMode={isDarkMode} />
        )}

        {/* Usuários Tab */}
        {activeTab === "usuarios" && (
          <AdminUsersTable themeStyles={themeStyles} searchTerm={searchTerm} />
        )}

        {/* Gestão Tab */}
        {activeTab === "gestao" && (
          <AdminProfessionalsManagement themeStyles={themeStyles} />
        )}

        {/* Profissionais Tab */}
        {activeTab === "profissionais" && (
          <AdminProfessionalsTable themeStyles={themeStyles} searchTerm={searchTerm} />
        )}

        {/* Agendamentos Tab */}
        {activeTab === "agendamentos" && (
          <AdminAppointmentsTable themeStyles={themeStyles} searchTerm={searchTerm} />
        )}

        {/* Notificações Tab */}
        {activeTab === "notificacoes" && (
          <AdminNotifications themeStyles={themeStyles} />
        )}

        {/* Configurações Tab */}
        {activeTab === "configuracoes" && (
          <div className="space-y-6">
            <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
              <h2 className={`font-display text-xl ${themeStyles.text} mb-4`}>Configurações do Sistema</h2>
              <div className="space-y-4">
                <div className={`flex items-center justify-between py-3 border-b ${themeStyles.border}`}>
                  <div>
                    <p className={`${themeStyles.text} font-medium`}>Tema do Painel</p>
                    <p className={`${themeStyles.textMuted} text-sm`}>Alternar entre modo claro e escuro</p>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`w-12 h-6 ${isDarkMode ? 'bg-secondary' : 'bg-gray-300'} rounded-full relative transition-colors`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className={`flex items-center justify-between py-3 border-b ${themeStyles.border}`}>
                  <div>
                    <p className={`${themeStyles.text} font-medium`}>Manutenção</p>
                    <p className={`${themeStyles.textMuted} text-sm`}>Colocar o sistema em modo manutenção</p>
                  </div>
                  <button className={`w-12 h-6 ${isDarkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded-full relative`}>
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                  </button>
                </div>
                <div className={`flex items-center justify-between py-3 border-b ${themeStyles.border}`}>
                  <div>
                    <p className={`${themeStyles.text} font-medium`}>Novos Cadastros</p>
                    <p className={`${themeStyles.textMuted} text-sm`}>Permitir novos cadastros de usuários</p>
                  </div>
                  <button className="w-12 h-6 bg-secondary rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
