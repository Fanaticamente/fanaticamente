import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Users, UserCheck, Calendar, Settings, LogOut, Search, Filter, 
  Shield, Sun, Moon, LayoutDashboard, DollarSign, ClipboardList, Bell, Crown, Menu, X, Scale
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
import AdminCouponManager from "@/components/admin/AdminCouponManager";
import AdminSubscriptionsManager from "@/components/admin/AdminSubscriptionsManager";
import AdminLegalManager from "@/components/admin/AdminLegalManager";

type TabType = "dashboard" | "financeiro" | "financeiro-cupons" | "financeiro-assinaturas" | "usuarios" | "gestao" | "profissionais" | "agendamentos" | "notificacoes" | "juridico-documentos" | "configuracoes";

const AdminDashboard = () => {
  const { user, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Valid tabs
  const validTabs: TabType[] = ["dashboard", "financeiro", "financeiro-cupons", "financeiro-assinaturas", "usuarios", "gestao", "profissionais", "agendamentos", "notificacoes", "juridico-documentos", "configuracoes"];
  
  // Get tab from URL or default
  const getTabFromUrl = (): TabType => {
    const urlTab = searchParams.get("tab") as TabType | null;
    return urlTab && validTabs.includes(urlTab) ? urlTab : "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    setMobileNavOpen(false);
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
    { id: "financeiro", label: "Financeiro", icon: DollarSign, subItems: [
      { id: "financeiro", label: "Visão Geral" },
      { id: "financeiro-cupons", label: "Gerenciador de Cupons" },
      { id: "financeiro-assinaturas", label: "Gerenciador de Assinaturas" },
    ]},
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "gestao", label: "Gestão", icon: ClipboardList },
    { id: "profissionais", label: "Profissionais", icon: UserCheck },
    { id: "agendamentos", label: "Agendamentos", icon: Calendar },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "juridico-documentos", label: "Jurídico", icon: Scale, subItems: [
      { id: "juridico-documentos", label: "Política & Termos" },
    ]},
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${themeStyles.bg}`}>
      {/* Mobile Topbar */}
      <header className={`md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 ${themeStyles.sidebar} border-b ${themeStyles.border}`}>
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
          className={`p-2 rounded-lg ${themeStyles.hoverBg}`}
        >
          <Menu className={`w-6 h-6 ${themeStyles.text}`} />
        </button>
        <img
          src={isDarkMode ? adminLogoDark : adminLogoLight}
          alt="Fanatica Mente"
          className="h-7 object-contain"
        />
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className={`p-2 rounded-lg ${themeStyles.hoverBg}`}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 h-dvh w-64 ${themeStyles.sidebar} border-r ${themeStyles.border} overflow-y-auto overscroll-contain z-50 transform transition-transform duration-200 md:translate-x-0 md:block ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="min-h-full flex flex-col">
        <div className="p-6 flex items-center justify-between flex-shrink-0">
          <img 
            src={isDarkMode ? adminLogoDark : adminLogoLight} 
            alt="Fanatica Mente" 
            className="h-8 object-contain"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${themeStyles.hoverBg} transition-colors hidden md:inline-flex`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Fechar menu"
              className={`md:hidden p-2 rounded-lg ${themeStyles.hoverBg}`}
            >
              <X className={`w-5 h-5 ${themeStyles.text}`} />
            </button>
          </div>
        </div>
        <p className={`px-6 -mt-3 mb-4 ${themeStyles.textMuted} text-sm flex-shrink-0`}>Painel Administrativo</p>

        <nav className="px-4 pb-6 space-y-1 flex-shrink-0">
          {navItems.map((item) => {
            const isParentActive = item.subItems
              ? item.subItems.some(sub => sub.id === activeTab)
              : activeTab === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.subItems && item.subItems.length > 0 && !validTabs.includes(item.id as TabType)) {
                      handleTabChange(item.subItems[0].id as TabType);
                    } else if (item.subItems && item.subItems.length > 0) {
                      // For groups whose parent id is also a valid tab (e.g. financeiro),
                      // keep current behavior; for pure groups (e.g. juridico) pick first sub.
                      handleTabChange(item.id as TabType);
                    } else {
                      handleTabChange(item.id as TabType);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isParentActive
                      ? "bg-secondary text-secondary-foreground"
                      : `${themeStyles.textMuted} ${themeStyles.hoverBg}`
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
                {item.subItems && isParentActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleTabChange(sub.id as TabType)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeTab === sub.id
                            ? `${themeStyles.text} font-medium`
                            : `${themeStyles.textMuted} ${themeStyles.hoverBg}`
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto flex-shrink-0 p-4 border-t ${themeStyles.border} ${themeStyles.sidebar}`}>
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-6">
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

        {/* Cupons Tab */}
        {activeTab === "financeiro-cupons" && (
          <AdminCouponManager themeStyles={themeStyles} isDarkMode={isDarkMode} />
        )}

        {/* Assinaturas Tab */}
        {activeTab === "financeiro-assinaturas" && (
          <AdminSubscriptionsManager themeStyles={themeStyles} />
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

        {/* Jurídico Tab */}
        {activeTab === "juridico-documentos" && (
          <AdminLegalManager themeStyles={themeStyles} />
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
