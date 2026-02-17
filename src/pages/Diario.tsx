import { useState } from "react";
import { Thermometer, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import MatchExpectationCard from "@/components/diario/MatchExpectationCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEmotionEntries } from "@/hooks/useEmotionEntries";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emotions = [
  { id: "muito-feliz", icon: "😄", label: "Muito Feliz", color: "bg-secondary" },
  { id: "feliz", icon: "🙂", label: "Feliz", color: "bg-secondary/70" },
  { id: "neutro", icon: "😐", label: "Neutro", color: "bg-primary" },
  { id: "triste", icon: "😢", label: "Triste", color: "bg-quiz" },
  { id: "muito-triste", icon: "😭", label: "Muito Triste", color: "bg-destructive" },
];

const Diario = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { todayEntry, recentEntries, weekStats, isLoading, saveEntry } = useEmotionEntries();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Get user's favorite club
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

  const handleSave = () => {
    if (!selectedEmotion) return;
    saveEntry.mutate(
      { emotion: selectedEmotion, note },
      {
        onSuccess: () => {
          toast.success("Registro salvo! ✅");
          setSelectedEmotion(null);
          setNote("");
        },
      }
    );
  };

  const getEmotionDetails = (id: string) => emotions.find((e) => e.id === id);
  const todayFormatted = format(new Date(), "dd 'de' MMMM", { locale: ptBR });

  const DiarioContent = () => (
    <>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-therapy/20 flex items-center justify-center">
          <Thermometer className="w-10 h-10 text-therapy" />
        </div>
        <h1 className="font-display text-4xl text-primary mb-2">
          Termômetro Torcedor
        </h1>
        <p className="text-muted-foreground">
          Como você está se sentindo hoje?
        </p>
      </div>

      {/* Match Expectation Card */}
      <MatchExpectationCard userClubId={profile?.favorite_club_id ?? null} />

      <div className={`${!isMobile ? "grid grid-cols-2 gap-6" : ""}`}>
        <div>
          {/* Today's Entry */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-card-foreground font-medium">
                Hoje, {todayFormatted}
              </span>
            </div>

            {todayEntry ? (
              <div className="text-center py-4">
                <span className="text-5xl mb-2 block">
                  {getEmotionDetails(todayEntry.emotion)?.icon}
                </span>
                <p className="text-card-foreground font-medium">
                  {getEmotionDetails(todayEntry.emotion)?.label}
                </p>
                {todayEntry.note && (
                  <p className="text-muted-foreground text-sm mt-2">
                    "{todayEntry.note}"
                  </p>
                )}
                <p className="text-muted-foreground text-xs mt-3">
                  Registro de hoje salvo. Você pode atualizá-lo abaixo.
                </p>
              </div>
            ) : null}

            <p className="text-muted-foreground text-sm mb-4">
              {todayEntry ? "Atualizar emoção:" : "Toque na emoção que melhor descreve seu dia:"}
            </p>

            <div className="flex justify-between mb-6">
              {emotions.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedEmotion === emotion.id
                      ? `${emotion.color} scale-110`
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-3xl">{emotion.icon}</span>
                  <span
                    className={`text-xs ${
                      selectedEmotion === emotion.id
                        ? "text-card-foreground font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {emotion.label}
                  </span>
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione uma nota sobre seu dia... (opcional)"
              className="w-full p-4 bg-muted border border-border rounded-xl text-card-foreground placeholder:text-muted-foreground resize-none h-24 focus:outline-none focus:border-primary"
            />

            <button
              onClick={handleSave}
              disabled={!selectedEmotion || saveEntry.isPending}
              className={`w-full mt-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${
                selectedEmotion
                  ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {saveEntry.isPending ? "Salvando..." : "Salvar Registro"}
            </button>
          </div>
        </div>

        <div>
          {/* Stats */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-card-foreground font-medium">Sua Semana</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-3xl text-secondary">{weekStats.happy}</p>
                <p className="text-muted-foreground text-xs">Dias Felizes</p>
              </div>
              <div>
                <p className="font-display text-3xl text-primary">{weekStats.neutral}</p>
                <p className="text-muted-foreground text-xs">Dias Neutros</p>
              </div>
              <div>
                <p className="font-display text-3xl text-quiz">{weekStats.sad}</p>
                <p className="text-muted-foreground text-xs">Dias Tristes</p>
              </div>
            </div>
          </div>

          {/* Previous Entries */}
          <div>
            <h2 className="font-display text-xl text-card-foreground mb-4">
              Registros Anteriores
            </h2>

            {recentEntries.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum registro ainda. Comece registrando como você se sente hoje!
              </p>
            ) : (
              <div className="space-y-3">
                {recentEntries
                  .filter((e) => e.entry_date !== format(new Date(), "yyyy-MM-dd"))
                  .map((entry) => {
                    const emotionDetails = getEmotionDetails(entry.emotion);
                    const entryDate = new Date(entry.entry_date + "T12:00:00");
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${emotionDetails?.color}`}
                        >
                          <span className="text-2xl">{emotionDetails?.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-card-foreground font-medium text-sm">
                            {entry.note || emotionDetails?.label}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {format(entryDate, "dd MMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
