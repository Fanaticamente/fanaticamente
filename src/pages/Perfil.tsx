import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { User, LogOut, CreditCard, Calendar, BookOpen, ChevronRight, Bell, Briefcase, Shield, Code, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getClubById, BrazilianClub } from "@/data/brazilianClubs";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDisplayAuthEmail } from "@/lib/appMode";
import { uploadProfessionalFile } from "@/lib/professionalUploads";
import { useQueryClient } from "@tanstack/react-query";

const Perfil = () => {
  const { user, roles, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; favorite_club_id: string | null } | null>(null);
  const [favoriteClub, setFavoriteClub] = useState<BrazilianClub | null>(null);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [diaryDaysCount, setDiaryDaysCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const displayEmail = getDisplayAuthEmail(user);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayTimerRef = useRef<number | null>(null);

  const revealCameraTemporarily = () => {
    setShowCameraOverlay(true);
    if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = window.setTimeout(() => setShowCameraOverlay(false), 3500);
  };

  const openFilePicker = () => {
    // Cancel the auto-hide timer: letting it fire while the native picker is
    // open re-renders the tree and can drop the pending change event.
    if (overlayTimerRef.current) {
      window.clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarClick = () => {
    if (!profile?.avatar_url) {
      openFilePicker();
      return;
    }
    if (showCameraOverlay) {
      openFilePicker();
    } else {
      revealCameraTemporarily();
    }
  };

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

        // Fetch distinct diary check-in days
        const { data: emotionRows } = await supabase
          .from("emotion_entries")
          .select("created_at")
          .eq("user_id", user.id);

        const uniqueDays = new Set(
          (emotionRows || []).map((row: { created_at: string }) =>
            new Date(row.created_at).toLocaleDateString("en-CA")
          )
        );
        setDiaryDaysCount(uniqueDays.size);

        // Fetch courses the user has access to
        const { count: coursesTotal } = await supabase
          .from("user_course_access")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setCoursesCount(coursesTotal || 0);

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
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      // Upload through the authenticated server action. It validates the
      // session and writes with server credentials, avoiding client Storage
      // policy/path mismatches while keeping ownership derived from the JWT.
      const { url } = await uploadProfessionalFile(file, "avatar");
      const publicUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        toast.error("Erro ao atualizar perfil");
        return;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      setShowCameraOverlay(false);
      // Propaga a nova foto para todos os lugares que exibem avatares
      queryClient.invalidateQueries({ queryKey: ["fan-ranking"] });
      queryClient.invalidateQueries({ queryKey: ["my-avatar"] });
      queryClient.invalidateQueries({ queryKey: ["club-ranking"] });
      try { window.dispatchEvent(new CustomEvent("profile-avatar-updated", { detail: { url: publicUrl } })); } catch {}
      toast.success("Foto atualizada!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar a imagem. Tente selecionar uma foto da galeria.");
    } finally {
      // Reset the input to allow re-selection
      e.target.value = '';
    }
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
  const profileContent = (
    <>
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden relative cursor-pointer"
            style={{ background: "var(--club-100)" }}
            aria-label={profile?.avatar_url ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover object-top" />
            ) : (
              <User className="w-10 h-10" style={{ color: "var(--club-600)" }} />
            )}
            {(!profile?.avatar_url || showCameraOverlay) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full pointer-events-none">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-sans font-semibold text-xl text-slate-900 truncate normal-case">
              {profile?.full_name || "Torcedor fanático"}
            </h1>
            <p className="text-slate-500 text-sm truncate">{displayEmail}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-semibold rounded-full"
                  style={{ background: "var(--club-100)", color: "var(--club-700)" }}
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

        <Link
          to="/perfil/editar"
          className="w-full py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center"
          style={{ background: "var(--club-600)", color: "var(--club-on)" }}
        >
          Editar perfil
        </Link>
      </div>

      {/* Role-specific Menu Items */}
      {roleMenuItems.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-slate-500 text-sm font-medium px-2 mb-3">Seus painéis</p>
          {roleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "var(--club-100)" }}
              >
                <item.icon className="w-5 h-5" style={{ color: "var(--club-700)" }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-slate-500 text-sm">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* My Team */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-sans font-semibold text-lg text-slate-900 mb-3 normal-case">
          Meu time do coração
        </h2>
        {favoriteClub ? (
          <div>
            <p className="text-slate-900 font-semibold text-lg">{favoriteClub.name}</p>
            <p className="text-slate-500 text-sm">
              {favoriteClub.league === "serie_a" ? "Série A" : "Série B"} — Brasileiro
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <p className="text-slate-900 font-semibold">Nenhum time selecionado</p>
              <p className="text-slate-500 text-sm">Configure nas preferências</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="font-sans font-semibold text-2xl" style={{ color: "var(--club-600)" }}>{diaryDaysCount}</p>
          <p className="text-slate-500 text-xs mt-1">Dias no diário</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="font-sans font-semibold text-2xl" style={{ color: "var(--club-600)" }}>{coursesCount}</p>
          <p className="text-slate-500 text-xs mt-1">Cursos feitos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="font-sans font-semibold text-2xl" style={{ color: "var(--club-600)" }}>{appointmentsCount}</p>
          <p className="text-slate-500 text-xs mt-1">Consultas</p>
        </div>
      </div>

      {/* Menu Items - Only show on mobile, desktop has sidebar */}
      {isMobile && (
        <div className="space-y-2 mb-6">
          {baseMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-medium">{item.label}</p>
                <p className="text-slate-500 text-sm">{item.description}</p>
              </div>
              {item.badge && (
                <span
                  className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: "var(--club-600)", color: "var(--club-on)" }}
                >
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* Logout - Only show on mobile, desktop has sidebar */}
      {isMobile && (
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </button>
      )}
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Perfil" hideSearch />
        <main className="pt-20 px-4">
          {profileContent}
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
      {profileContent}
    </UserDesktopLayout>
  );
};

export default Perfil;
