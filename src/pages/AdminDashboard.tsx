import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, Calendar, TrendingUp, Settings, LogOut, Search, Filter, MoreVertical, Shield, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"usuarios" | "profissionais" | "agendamentos" | "configuracoes">("usuarios");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!hasRole("admin")) {
      navigate("/");
      return;
    }
  }, [hasRole, navigate]);

  const stats = [
    { label: "Total Usuários", value: "1,234", icon: Users, color: "bg-primary/20 text-primary" },
    { label: "Profissionais Ativos", value: "48", icon: UserCheck, color: "bg-secondary/20 text-secondary" },
    { label: "Consultas/Mês", value: "356", icon: Calendar, color: "bg-blue-500/20 text-blue-500" },
    { label: "Crescimento", value: "+12%", icon: TrendingUp, color: "bg-green-500/20 text-green-500" },
  ];

  const demoUsers = [
    { id: "1", name: "João Silva", email: "joao@email.com", role: "user", club: "Flamengo", status: "active" },
    { id: "2", name: "Maria Santos", email: "maria@email.com", role: "user", club: "Palmeiras", status: "active" },
    { id: "3", name: "Pedro Costa", email: "pedro@email.com", role: "professional", club: "Corinthians", status: "active" },
    { id: "4", name: "Ana Oliveira", email: "ana@email.com", role: "user", club: "São Paulo", status: "inactive" },
  ];

  const demoProfessionals = [
    { id: "1", name: "Dr. Carlos Silva", crp: "CRP 12345", specialty: "Ansiedade", subscription: "Anual", status: "active", consultas: 45 },
    { id: "2", name: "Dra. Ana Paula", crp: "CRP 67890", specialty: "Esportiva", subscription: "Mensal", status: "active", consultas: 32 },
    { id: "3", name: "Dr. Fernando Lima", crp: "CRP 11223", specialty: "Família", subscription: "Semestral", status: "pending", consultas: 0 },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden md:block">
        <div className="p-6">
          <h1 className="font-display text-2xl text-primary">
            fanática<span className="text-secondary">MENTE</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Painel Administrativo</p>
        </div>

        <nav className="px-4 space-y-2">
          {[
            { id: "usuarios", label: "Usuários", icon: Users },
            { id: "profissionais", label: "Profissionais", icon: UserCheck },
            { id: "agendamentos", label: "Agendamentos", icon: Calendar },
            { id: "configuracoes", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-card-foreground text-sm font-medium truncate">Admin</p>
              <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="font-display text-3xl text-card-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-colors">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Usuários Tab */}
        {activeTab === "usuarios" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-xl text-card-foreground">Usuários</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Tipo</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Clube</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {demoUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm">👤</span>
                          </div>
                          <span className="text-card-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "professional" ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                        }`}>
                          {user.role === "professional" ? "Profissional" : "Usuário"}
                        </span>
                      </td>
                      <td className="p-4 text-card-foreground">{user.club}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        }`}>
                          {user.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-destructive/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profissionais Tab */}
        {activeTab === "profissionais" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-xl text-card-foreground">Profissionais Parceiros</h2>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform">
                + Adicionar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 text-muted-foreground font-medium">Profissional</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">CRP</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Especialidade</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Plano</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Consultas</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {demoProfessionals.map((prof) => (
                    <tr key={prof.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                            <span className="text-sm">🧑‍⚕️</span>
                          </div>
                          <span className="text-card-foreground">{prof.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{prof.crp}</td>
                      <td className="p-4 text-card-foreground">{prof.specialty}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                          {prof.subscription}
                        </span>
                      </td>
                      <td className="p-4 text-card-foreground">{prof.consultas}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          prof.status === "active" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {prof.status === "active" ? "Ativo" : "Pendente"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agendamentos Tab */}
        {activeTab === "agendamentos" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-xl text-card-foreground mb-4">Agendamentos</h2>
            <div className="h-64 bg-muted/50 rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground">Calendário de agendamentos em breve</span>
            </div>
          </div>
        )}

        {/* Configurações Tab */}
        {activeTab === "configuracoes" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-xl text-card-foreground mb-4">Configurações do Sistema</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-card-foreground font-medium">Manutenção</p>
                    <p className="text-muted-foreground text-sm">Colocar o sistema em modo manutenção</p>
                  </div>
                  <button className="w-12 h-6 bg-muted rounded-full relative">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-card rounded-full transition-transform" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-card-foreground font-medium">Novos Cadastros</p>
                    <p className="text-muted-foreground text-sm">Permitir novos cadastros de usuários</p>
                  </div>
                  <button className="w-12 h-6 bg-secondary rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-card rounded-full transition-transform" />
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
