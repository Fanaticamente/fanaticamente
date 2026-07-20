import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { getDisplayAuthEmail } from "@/lib/appMode";

const Perfil = () => {
  const { user, roles, signOut, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; favorite_club_id: string | null } | null>(null);
  const [favoriteClub, setFavoriteClub] = useState<BrazilianClub | null>(null);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const displayEmail = getDisplayAuthEmail(user);

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
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      // Normalize to JPEG to avoid HEIC/HEIF from iPhone (browsers can't
      // decode HEIC to display later) and to standardize the storage key.
      let uploadBlob: Blob = file;
      let contentType = file.type || "image/jpeg";
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const blob: Blob | null = await new Promise((res) =>
            canvas.toBlob((b) => res(b), "image/jpeg", 0.9),
          );
          if (blob) {
            uploadBlob = blob;
            contentType = "image/jpeg";
          }
        }
      } catch (convErr) {
        console.warn("[Avatar] Não foi possível normalizar a imagem, enviando original.", convErr);
      }

      const filePath = `avatars/${user.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadBlob, { upsert: true, contentType });

      if (uploadError) {
        console.error("[Avatar] Upload error:", uploadError);
        toast.error(uploadError.message || "Erro ao enviar foto. Tente outra imagem (.jpg ou .png).");
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Cache-buster so the new image shows up immediately.
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        toast.error("Erro ao atualizar perfil");
        return;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      toast.success("Foto atualizada!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Erro ao processar a imagem. Tente selecionar uma foto da galeria.");
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
  const ProfileContent = () => (
    <>
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label
            className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden relative cursor-pointer group"
            style={{ background: "var(--club-100)" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover object-top" />
            ) : (
              <User className="w-10 h-10" style={{ color: "var(--club-600)" }} />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-opacity rounded-full">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
              capture={undefined}
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </label>
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

        <AccountSettingsDialog
          trigger={
            <button
              className="w-full py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--club-600)", color: "var(--club-on)" }}
            >
              Editar perfil
            </button>
          }
        />
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
          <p className="font-sans font-semibold text-2xl" style={{ color: "var(--club-600)" }}>15</p>
          <p className="text-slate-500 text-xs mt-1">Dias no diário</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="font-sans font-semibold text-2xl" style={{ color: "var(--club-600)" }}>3</p>
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
