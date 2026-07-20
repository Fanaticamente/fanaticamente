import { useState } from "react";
import { Calendar, Trophy, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMatchExpectations } from "@/hooks/useMatchExpectations";
import { toast } from "sonner";

const confidenceOptions = [
  { id: "confiante", icon: "💪", label: "Confiante" },
  { id: "ansioso", icon: "😰", label: "Ansioso" },
  { id: "tranquilo", icon: "😌", label: "Tranquilo" },
  { id: "pessimista", icon: "😟", label: "Pessimista" },
  { id: "empolgado", icon: "🔥", label: "Empolgado" },
];

const impactOptions = [
  { id: "nao-interfere", label: "Não vai interferir no meu dia" },
  { id: "feliz-mas-segue", label: "Fico feliz/triste, mas sigo em frente" },
  { id: "afeta-muito", label: "Afeta bastante meu humor" },
  { id: "nao-sei", label: "Não sei dizer" },
];

interface MatchExpectationCardProps {
  userClubId: string | null;
}

const MatchExpectationCard = ({ userClubId }: MatchExpectationCardProps) => {
  const { upcomingMatch, existingExpectation, saveExpectation, showMatchCard } =
    useMatchExpectations(userClubId);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [winImpact, setWinImpact] = useState<string | null>(null);
  const [lossImpact, setLossImpact] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!showMatchCard || !upcomingMatch) return null;

  const matchDate = new Date(upcomingMatch.match_date + "T12:00:00");
  const formattedDate = format(matchDate, "dd 'de' MMMM", { locale: ptBR });

  const handleSave = () => {
    if (!confidence) return;
    saveExpectation.mutate(
      {
        confidence_level: confidence,
        win_impact: winImpact || undefined,
        loss_impact: lossImpact || undefined,
      },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Atividade concluída! +1 ponto");
        },
      }
    );
  };

  if (saved || existingExpectation) {
    return (
      <div className="bg-card border border-secondary/30 rounded-2xl p-6 mb-6 text-center">
        <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
        <p className="text-secondary font-bold">Expectativa registrada! ⚽</p>
        <p className="text-muted-foreground text-sm">Boa sorte pro jogo!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="text-card-foreground font-bold">Dia de Jogo!</span>
      </div>

      <p className="text-muted-foreground text-sm mb-1">
        {upcomingMatch.competition && (
          <span className="text-primary font-medium">{upcomingMatch.competition} • </span>
        )}
        {formattedDate}
        {upcomingMatch.match_time && ` às ${upcomingMatch.match_time}`}
      </p>
      <p className="text-card-foreground font-medium mb-4">
        {upcomingMatch.is_home
          ? `Seu time x ${upcomingMatch.opponent}`
          : `${upcomingMatch.opponent} x Seu time`}
      </p>

      <p className="text-muted-foreground text-sm mb-3">
        Como você está se sentindo sobre o jogo?
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {confidenceOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setConfidence(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
              confidence === opt.id
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {confidence && (
        <>
          <p className="text-muted-foreground text-sm mb-2">
            Se ganhar, como isso afeta você?
          </p>
          <div className="space-y-2 mb-4">
            {impactOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setWinImpact(opt.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  winImpact === opt.id
                    ? "bg-secondary/20 text-secondary border border-secondary/40"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-muted-foreground text-sm mb-2">
            E se perder?
          </p>
          <div className="space-y-2 mb-5">
            {impactOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLossImpact(opt.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  lossImpact === opt.id
                    ? "bg-destructive/20 text-destructive border border-destructive/40"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        disabled={!confidence || saveExpectation.isPending}
        className={`w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${
          confidence
            ? "bg-primary text-primary-foreground hover:scale-[1.02]"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {saveExpectation.isPending ? "Salvando..." : "Registrar Expectativa"}
      </button>
    </div>
  );
};

export default MatchExpectationCard;
