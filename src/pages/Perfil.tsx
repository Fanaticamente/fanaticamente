import { useEffect, useState } from "react";
import { User, LogOut, CreditCard, Calendar, BookOpen, ChevronRight, Bell, Briefcase, Shield, Code, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountSettingsDialog from "@/components/profile/AccountSettingsDialog";
import { getClubById, BrazilianClub } from "@/data/brazilianClubs";
import { useIsMobile } from "@/hooks/use-mobile";

const Perfil = () => {
  const { user, roles, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; favorite_club_id: string | null } | null>(null);
  const [favoriteClub, setFavoriteClub] = useState<BrazilianClub | null>(null);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !loading) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, favorite_club_id")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setProfile(data);
          // Buscar dados do clube favorito
          if (data.favorite_club_id) {
            const club = getClubById(data.favorite_club_id);
            setFavoriteClub(club || null);
          }
        }

        // Fetch appointments count
        const { count } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        setAppointmentsCount(count || 0);

        // Fetch unread notifications count
        const { count: notifCount } = await supabase
          .from("user_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        
        setUnreadNotifications(notifCount || 0);
        setProfileLoading(false);
      } else if (!loading && !user) {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, loading, hasRole]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      console.error(uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', user.id);

    if (updateError) {
      toast.error("Erro ao atualizar perfil");
      return;
    }

    setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : prev);
    toast.success("Foto atualizada!");
  };

  if (loading || profileLoading) {
    return null;
  }

  const baseMenuItems = [
    {
      icon: Calendar,
      label: "Meus Agendamentos",
      description: "Ver consultas marcadas",
      path: "/meus-agendamentos",
      badge: appointmentsCount > 0 ? appointmentsCount.toString() : null,
    },
    {
      icon: BookOpen,
      label: "Meus Cursos",
      description: "Acessar cursos comprados",
      path: "/cursos",
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
      description: "Seus alertas e atualizações",
      path: "/perfil/notificacoes",
      badge: unreadNotifications > 0 ? unreadNotifications.toString() : null,
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

  // Profile Content Component (shared between layouts)
  const ProfileContent = () => (
    <>
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover object-top" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
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

        <AccountSettingsDialog 
          trigger={
            <button className="w-full py-3 border border-border rounded-xl text-card-foreground font-medium hover:border-primary transition-colors">
              Editar Perfil
            </button>
          }
        />
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
          {favoriteClub ? (
            <>
              <div>
                <p className="text-card-foreground font-bold text-lg">{favoriteClub.name}</p>
                <p className="text-muted-foreground text-sm">
                  {favoriteClub.league === "serie_a" ? "Série A" : "Série B"} - Brasileiro
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-3xl">⚽</span>
              </div>
              <div>
                <p className="text-card-foreground font-bold text-lg">Nenhum time selecionado</p>
                <p className="text-muted-foreground text-sm">Configure nas preferências</p>
              </div>
            </>
          )}
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
          <p className="font-display text-3xl text-therapy">{appointmentsCount}</p>
          <p className="text-muted-foreground text-xs">Consultas</p>
        </div>
      </div>

      {/* Menu Items - Only show on mobile, desktop has sidebar */}
      {isMobile && (
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
      )}

      {/* Logout - Only show on mobile, desktop has sidebar */}
      {isMobile && (
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      )}
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-4">
          <ProfileContent />
          {/* Spacer para manter distância do BottomNav */}
          <div aria-hidden className="h-28" />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <UserDesktopLayout title="Meu Perfil" subtitle="Gerencie suas informações e preferências">
      <ProfileContent />
    </UserDesktopLayout>
  );
};

export default Perfil;
