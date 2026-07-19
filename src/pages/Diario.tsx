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
        <h1 className="font-display text-4xl text-primary mb-2">
          Termômetro Torcedor
        </h1>
        <p className="text-muted-foreground">
          Como você está se sentindo hoje?
        </p>
      </div>

      <MatchExpectationCard userClubId={profile?.favorite_club_id ?? null} />
      <EmotionTacticalBoard />
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Termômetro Torcedor" />
        <main className="pt-20 px-4">
          <DiarioContent />
          <div aria-hidden className="h-28" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Termômetro Torcedor" subtitle="Acompanhe suas emoções dia a dia">
      <DiarioContent />
    </UserDesktopLayout>
  );
};

export default Diario;
