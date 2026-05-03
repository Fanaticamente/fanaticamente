import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Home, Users, BookOpen, Radio, Newspaper, User, Settings, ShoppingBag, Thermometer, Shirt, LogOut, Tv, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppMenu } from "@/hooks/useAppContent";
import { useAppPages } from "@/hooks/useAppPages";
import { supabase } from "@/integrations/supabase/client";
import logoHeader from "@/assets/logo-header.png";
import { SetorSaudeInlineIcon } from "@/components/icons/SetorSaudeInlineIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { brazilianClubs } from "@/data/brazilianClubs";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Users,
  BookOpen,
  Radio,
  Newspaper,
  User,
  Settings,
  ShoppingBag,
  Thermometer,
  Shirt,
  Tv,
  Heart,
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data: menuData } = useAppMenu('header_menu');
  const { data: pages } = useAppPages('mobile');
  const { user } = useAuth();
  const { data: sidebarClubConfig } = useModuleConfig("sidebar_user_club");
  const sidebarShowBadges =
    (sidebarClubConfig?.config as Record<string, unknown> | undefined)?.show_badges !== false;
  const sidebarHiddenBadges =
    (((sidebarClubConfig?.config as Record<string, unknown> | undefined)?.hidden_badges) as string[] | undefined) || [];
  const sidebarClubDisplayMode =
    (((sidebarClubConfig?.config as Record<string, unknown> | undefined)?.club_display_mode) as "badge" | "flag") || "badge";

  const { data: userProfile } = useQuery({
    queryKey: ["sidebar-user-profile", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("favorite_club_id, full_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const userClub = userProfile?.favorite_club_id
    ? brazilianClubs.find((c) => c.id === userProfile.favorite_club_id)
    : null;
  const showUserClubBadge =
    !!userClub && sidebarShowBadges && !sidebarHiddenBadges.includes(userClub.id);

  const allItems = menuData?.items || [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Users", label: "Terapeutas", path: "/terapeutas" },
    { icon: "BookOpen", label: "FanatiClass", path: "/cursos" },
    { icon: "Radio", label: "Alambrado FM", path: "/radio" },
    { icon: "Heart", label: "Setor Saúde", path: "/setor-saude" },
    { icon: "Newspaper", label: "Notícias", path: "/futebol" },
    { icon: "Shirt", label: "FanaticaShop", path: "/loja" },
    { icon: "Tv", label: "FanatiCazé TV", path: "/fanaticaze-tv" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ];

  // Separate Perfil from the rest — it goes to the bottom
  const mainItems = allItems.filter((item) => item.icon !== "User");
  // Ensure FanaticaShop is present after Notícias
  const hasShop = mainItems.some((i) => i.path === "/loja");
  if (!hasShop) {
    const newsIndex = mainItems.findIndex((i) => i.path === "/futebol");
    mainItems.splice(newsIndex + 1, 0, { icon: "Shirt", label: "FanaticaShop", path: "/loja" });
  }
  // Ensure FanatiCazé TV is present after FanaticaShop
  const hasCaze = mainItems.some((i) => i.path === "/fanaticaze-tv");
  if (!hasCaze) {
    const shopIndex = mainItems.findIndex((i) => i.path === "/loja");
    mainItems.splice(shopIndex + 1, 0, { icon: "Tv", label: "FanatiCazé TV", path: "/fanaticaze-tv" });
  }
  // Ensure Setor Saúde is present above Notícias (futebol)
  const hasSaude = mainItems.some((i) => i.path === "/setor-saude");
  if (!hasSaude) {
    const futebolIndex = mainItems.findIndex((i) => i.path === "/futebol");
    const insertAt = futebolIndex >= 0 ? futebolIndex : mainItems.length;
    mainItems.splice(insertAt, 0, { icon: "Heart", label: "Setor Saúde", path: "/setor-saude" });
  }

  const profileItem = allItems.find((item) => item.icon === "User") || { icon: "User", label: "Perfil", path: "/perfil" };

  // Filter out items whose page is hidden in the management panel
  const isPathVisible = (path: string) => {
    if (!pages || pages.length === 0) return true;
    const page = pages.find((p) => p.path === path);
    return page ? page.is_visible !== false : true;
  };
  const visibleMainItems = mainItems.filter((item) => isPathVisible(item.path));

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)] transform-gpu will-change-transform">
      <div className="flex items-center justify-between px-4 py-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus-visible:outline-none">
              <Menu className="w-6 h-6 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background border-border p-0 flex flex-col" style={{ paddingTop: 'max(0px, env(safe-area-inset-top, 0px))' }}>
            <div className="p-6 border-b border-border flex flex-col items-center">
              <img
                src={logoHeader}
                alt="Logo"
                className="h-12 w-auto"
                width={48}
                height={48}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <p className="text-muted-foreground text-sm mt-2">
                Saúde mental para torcedores
              </p>
              {showUserClubBadge && userClub && (
                <div className="mt-4 flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-full bg-white p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                    {sidebarClubDisplayMode === "flag" ? (
                      <ClubFlag clubId={userClub.id} className="w-full h-full" />
                    ) : (
                      <img
                        src={userClub.badgeUrl}
                        alt={userClub.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <span className="text-card-foreground text-xs font-medium">
                    {userClub.shortName || userClub.name}
                  </span>
                </div>
              )}
            </div>

            {/* Main menu items */}
            <nav className="p-4 flex-1 overflow-y-auto">
              {visibleMainItems.map((item) => {
                const IconComponent = iconMap[item.icon] || Home;
                const isSetorSaude = item.path === "/setor-saude";
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors group"
                  >
                    {isSetorSaude ? (
                      <SetorSaudeInlineIcon
                        variant="white"
                        className="h-6 w-6 object-contain group-hover:scale-110 transition-transform"
                        aria-hidden
                        focusable="false"
                      />
                    ) : (
                      <IconComponent className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-card-foreground font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom section: Perfil + Sair */}
            <div className="border-t border-border p-4 space-y-1">
              <Link
                to={profileItem.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors group"
              >
                <User className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span className="text-card-foreground font-medium">{profileItem.label}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors group w-full text-left"
              >
                <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-red-400 font-medium">Sair</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center">
          <img
            src={logoHeader}
            alt="Logo"
            className="h-8 w-auto"
            width={32}
            height={32}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </Link>

        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Search className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;