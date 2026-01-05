import { useEffect, useState } from "react";
import { User, Settings, LogOut, CreditCard, Calendar, BookOpen, ChevronRight, Bell, Briefcase, Shield, Code } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Perfil = () => {
  const { user, roles, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    // Redirecionar profissionais para o painel profissional
    if (!loading && user && hasRole("professional")) {
      navigate("/profissional");
    }
  }, [user, loading, navigate, hasRole]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const baseMenuItems = [
    {
      icon: Calendar,
      label: "Meus Agendamentos",
      description: "Ver consultas marcadas",
      path: "/perfil/agendamentos",
      badge: "2",
    },
    {
      icon: BookOpen,
      label: "Meus Cursos",
      description: "Acessar cursos comprados",
      path: "/perfil/cursos",
      badge: null,
    },
    {
      icon: CreditCard,
      label: "Pagamentos",
      description: "Histórico e métodos de pagamento",
      path: "/perfil/pagamentos",
      badge: null,
    },
    {
      icon: Bell,
      label: "Notificações",
      description: "Configurar alertas",
      path: "/perfil/notificacoes",
      badge: "5",
    },
    {
      icon: Settings,
      label: "Configurações",
      description: "Preferências da conta",
      path: "/perfil/configuracoes",
      badge: null,
    },
  ];

  // Role-based menu items
  const roleMenuItems = [];

  if (hasRole("professional")) {
    roleMenuItems.push({
      icon: Briefcase,
      label: "Painel do Profissional",
      description: "Gerenciar consultas e agenda",
      path: "/profissional",
      badge: null,
      color: "text-therapy",
      bgColor: "bg-therapy/10",
    });
  }

  if (hasRole("developer")) {
    roleMenuItems.push({
      icon: Code,
      label: "Painel do Desenvolvedor",
      description: "Ferramentas e recursos de dev",
      path: "/desenvolvedor",
      badge: null,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    });
  }

  if (hasRole("admin")) {
    roleMenuItems.push({
      icon: Shield,
      label: "Painel Administrativo",
      description: "Gerenciar usuários e sistema",
      path: "/admin",
      badge: null,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24 px-4">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl text-card-foreground">
                {profile?.full_name || "Torcedor Fanático"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {roles.map((role) => (
                  <span
                    key={role}
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      role === "admin"
                        ? "bg-destructive/20 text-destructive"
                        : role === "developer"
                        ? "bg-secondary/20 text-secondary"
                        : role === "professional"
                        ? "bg-therapy/20 text-therapy"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {role === "admin" ? "Admin" : 
                     role === "developer" ? "Dev" : 
                     role === "professional" ? "Profissional" : 
                     "Usuário"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button className="w-full py-3 border border-border rounded-xl text-card-foreground font-medium hover:border-primary transition-colors">
            Editar Perfil
          </button>
        </div>

        {/* Role-specific Menu Items */}
        {roleMenuItems.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-muted-foreground text-sm font-medium px-2 mb-3">Seus Painéis</p>
            {roleMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 ${item.bgColor} border border-border rounded-xl p-4 hover:border-current transition-colors group`}
              >
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${item.color}`}>{item.label}</p>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${item.color} group-hover:translate-x-1 transition-transform`} />
              </Link>
            ))}
          </div>
        )}

        {/* My Team */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl text-card-foreground mb-4">
            Meu Time do Coração
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>
            <div>
              <p className="text-card-foreground font-bold text-lg">Flamengo</p>
              <p className="text-muted-foreground text-sm">Série A - Brasileiro</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-primary">15</p>
            <p className="text-muted-foreground text-xs">Dias no diário</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-secondary">3</p>
            <p className="text-muted-foreground text-xs">Cursos feitos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-therapy">2</p>
            <p className="text-muted-foreground text-xs">Consultas</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {baseMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-card-foreground font-medium">{item.label}</p>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
              {item.badge && (
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
