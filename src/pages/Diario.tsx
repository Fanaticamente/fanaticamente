import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import MatchExpectationCard from "@/components/diario/MatchExpectationCard";
import EmotionTacticalBoard from "@/components/diario/EmotionTacticalBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Diario = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-club", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("favorite_club_id")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const DiarioContent = () => (
    <>
      <div className="text-center mb-6">
        <h1
          className="font-sans text-2xl font-bold text-slate-900 mb-1"
          style={{ textTransform: "none" }}
        >
          Campo das emoções
        </h1>
        <p className="text-sm text-slate-500">
          Escale seu time e gere uma reflexão.
        </p>
      </div>

      <div
        style={{
          ["--card" as any]: "0 0% 100%",
          ["--card-foreground" as any]: "222 47% 11%",
          ["--background" as any]: "0 0% 100%",
          ["--foreground" as any]: "222 47% 11%",
          ["--border" as any]: "214 32% 91%",
          ["--muted" as any]: "210 40% 96%",
          ["--muted-foreground" as any]: "215 16% 47%",
          ["--primary" as any]: "160 84% 39%",
          ["--primary-foreground" as any]: "0 0% 100%",
          ["--secondary" as any]: "160 84% 39%",
          ["--secondary-foreground" as any]: "0 0% 100%",
          ["--accent" as any]: "160 84% 39%",
          ["--accent-foreground" as any]: "0 0% 100%",
        }}
      >
        <MatchExpectationCard userClubId={profile?.favorite_club_id ?? null} />
        <EmotionTacticalBoard />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans normal-case">
        <Header title="Atividades" hideSearch />
        <main className="pt-[calc(56px+1cm)] px-4">
          <DiarioContent />
          <div aria-hidden className="h-28" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Campo das emoções" subtitle="Escale seu time e gere uma reflexão.">
      <DiarioContent />
    </UserDesktopLayout>
  );
};

export default Diario;
