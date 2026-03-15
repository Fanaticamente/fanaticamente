import { useState, useEffect } from "react";
import { ClipboardList, RotateCcw, Loader2, Swords, Shield, X, CloudLightning } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

/* ── Emotions ── */
const positiveEmotions = [
  { id: "alegre", icon: "😄", label: "Alegre" },
  { id: "euforico", icon: "🤩", label: "Eufórico" },
  { id: "feliz", icon: "🙂", label: "Feliz" },
  { id: "confiante", icon: "💪", label: "Confiante" },
  { id: "empolgado", icon: "🎉", label: "Empolgado" },
  { id: "orgulhoso", icon: "🏆", label: "Orgulhoso" },
  { id: "esperancoso", icon: "⭐", label: "Esperançoso" },
  { id: "grato", icon: "🙏", label: "Grato" },
  { id: "aliviado", icon: "😮‍💨", label: "Aliviado" },
  { id: "inspirado", icon: "✨", label: "Inspirado" },
  { id: "motivado", icon: "🔥", label: "Motivado" },
];

const negativeEmotions = [
  { id: "triste", icon: "😢", label: "Triste" },
  { id: "raiva", icon: "😡", label: "Raiva" },
  { id: "ansioso", icon: "😰", label: "Ansioso" },
  { id: "decepcionado", icon: "😞", label: "Decepcionado" },
  { id: "medo", icon: "😨", label: "Medo" },
  { id: "irritado", icon: "😤", label: "Irritado" },
  { id: "desanimado", icon: "😔", label: "Desanimado" },
  { id: "impaciente", icon: "⏳", label: "Impaciente" },
  { id: "frustrado", icon: "😣", label: "Frustrado" },
  { id: "inseguro", icon: "😟", label: "Inseguro" },
  { id: "envergonhado", icon: "😳", label: "Envergonhado" },
];

const allEmotions = [...positiveEmotions, ...negativeEmotions];
const getEmotion = (id: string) => allEmotions.find((e) => e.id === id);

/* ── Formations ── */
interface FormationSlot {
  id: string;
  x: number;
  y: number;
  sector: "defesa" | "meio_campo" | "ataque" | "centroavante";
}

interface Formation {
  id: string;
  label: string;
  type: "ofensiva" | "defensiva";
  slots: FormationSlot[];
}

const formations: Formation[] = [
  {
    id: "4-3-3", label: "4-3-3", type: "ofensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 12, y: 74, sector: "defesa" },
      { id: "d2", x: 37, y: 76, sector: "defesa" },
      { id: "d3", x: 63, y: 76, sector: "defesa" },
      { id: "d4", x: 88, y: 74, sector: "defesa" },
      { id: "m1", x: 22, y: 50, sector: "meio_campo" },
      { id: "m2", x: 50, y: 53, sector: "meio_campo" },
      { id: "m3", x: 78, y: 50, sector: "meio_campo" },
      { id: "a1", x: 18, y: 25, sector: "ataque" },
      { id: "a2", x: 50, y: 20, sector: "ataque" },
      { id: "a3", x: 82, y: 25, sector: "ataque" },
    ],
  },
  {
    id: "3-4-3", label: "3-4-3", type: "ofensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 22, y: 76, sector: "defesa" },
      { id: "d2", x: 50, y: 78, sector: "defesa" },
      { id: "d3", x: 78, y: 76, sector: "defesa" },
      { id: "m1", x: 12, y: 50, sector: "meio_campo" },
      { id: "m2", x: 37, y: 53, sector: "meio_campo" },
      { id: "m3", x: 63, y: 53, sector: "meio_campo" },
      { id: "m4", x: 88, y: 50, sector: "meio_campo" },
      { id: "a1", x: 18, y: 25, sector: "ataque" },
      { id: "a2", x: 50, y: 20, sector: "ataque" },
      { id: "a3", x: 82, y: 25, sector: "ataque" },
    ],
  },
  {
    id: "3-5-2", label: "3-5-2", type: "ofensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 22, y: 76, sector: "defesa" },
      { id: "d2", x: 50, y: 78, sector: "defesa" },
      { id: "d3", x: 78, y: 76, sector: "defesa" },
      { id: "m1", x: 10, y: 50, sector: "meio_campo" },
      { id: "m2", x: 30, y: 53, sector: "meio_campo" },
      { id: "m3", x: 50, y: 48, sector: "meio_campo" },
      { id: "m4", x: 70, y: 53, sector: "meio_campo" },
      { id: "m5", x: 90, y: 50, sector: "meio_campo" },
      { id: "a1", x: 35, y: 22, sector: "ataque" },
      { id: "a2", x: 65, y: 22, sector: "ataque" },
    ],
  },
  {
    id: "4-5-1", label: "4-5-1", type: "defensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 12, y: 74, sector: "defesa" },
      { id: "d2", x: 37, y: 76, sector: "defesa" },
      { id: "d3", x: 63, y: 76, sector: "defesa" },
      { id: "d4", x: 88, y: 74, sector: "defesa" },
      { id: "m1", x: 10, y: 50, sector: "meio_campo" },
      { id: "m2", x: 30, y: 53, sector: "meio_campo" },
      { id: "m3", x: 50, y: 48, sector: "meio_campo" },
      { id: "m4", x: 70, y: 53, sector: "meio_campo" },
      { id: "m5", x: 90, y: 50, sector: "meio_campo" },
      { id: "ca", x: 50, y: 20, sector: "centroavante" },
    ],
  },
  {
    id: "5-4-1", label: "5-4-1", type: "defensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 8, y: 74, sector: "defesa" },
      { id: "d2", x: 28, y: 76, sector: "defesa" },
      { id: "d3", x: 50, y: 78, sector: "defesa" },
      { id: "d4", x: 72, y: 76, sector: "defesa" },
      { id: "d5", x: 92, y: 74, sector: "defesa" },
      { id: "m1", x: 15, y: 50, sector: "meio_campo" },
      { id: "m2", x: 38, y: 53, sector: "meio_campo" },
      { id: "m3", x: 62, y: 53, sector: "meio_campo" },
      { id: "m4", x: 85, y: 50, sector: "meio_campo" },
      { id: "ca", x: 50, y: 20, sector: "centroavante" },
    ],
  },
  {
    id: "4-2-3-1", label: "4-2-3-1", type: "defensiva",
    slots: [
      { id: "gk", x: 50, y: 90, sector: "defesa" },
      { id: "d1", x: 12, y: 74, sector: "defesa" },
      { id: "d2", x: 37, y: 76, sector: "defesa" },
      { id: "d3", x: 63, y: 76, sector: "defesa" },
      { id: "d4", x: 88, y: 74, sector: "defesa" },
      { id: "m1", x: 35, y: 56, sector: "meio_campo" },
      { id: "m2", x: 65, y: 56, sector: "meio_campo" },
      { id: "a1", x: 18, y: 38, sector: "ataque" },
      { id: "a2", x: 50, y: 35, sector: "ataque" },
      { id: "a3", x: 82, y: 38, sector: "ataque" },
      { id: "ca", x: 50, y: 18, sector: "centroavante" },
    ],
  },
];

/* ── Pulsing animation CSS ── */
const pulseStyle = `
@keyframes slotGrow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.25); }
}
`;

/* ── Component ── */
const EmotionTacticalBoard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: existingLineup, isLoading: loadingExisting } = useQuery({
    queryKey: ["emotional-lineup-today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emotional_lineups" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("entry_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (existingLineup) {
      const f = formations.find((fm) => fm.id === (existingLineup as any).formation);
      if (f) setSelectedFormation(f);
      const lineup = (existingLineup as any).lineup as Record<string, string[]>;
      if (lineup && f) {
        const newAssignments: Record<string, string> = {};
        const sectorSlots: Record<string, string[]> = {};
        f.slots.forEach((s) => {
          if (!sectorSlots[s.sector]) sectorSlots[s.sector] = [];
          sectorSlots[s.sector].push(s.id);
        });
        Object.entries(lineup).forEach(([sector, emotions]) => {
          const slotIds = sectorSlots[sector] || [];
          (emotions as string[]).forEach((em, i) => {
            if (slotIds[i]) {
              const emotionObj = allEmotions.find((e) => e.label === em);
              if (emotionObj) newAssignments[slotIds[i]] = emotionObj.id;
            }
          });
        });
        setAssignments(newAssignments);
      }
      if ((existingLineup as any).ai_analysis) {
        setAiAnalysis((existingLineup as any).ai_analysis);
      }
      setConfirmed(true);
    }
  }, [existingLineup]);

  const isCompleted = !!existingLineup || confirmed;
  const currentSlots = selectedFormation?.slots ?? [];
  const activeSlotId = !isCompleted && selectedFormation
    ? currentSlots.find((s) => !assignments[s.id])?.id ?? null
    : null;

  const handleSlotClick = (slotId: string) => {
    if (isCompleted) return;
    if (assignments[slotId]) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      return;
    }
    if (slotId !== activeSlotId) return;
    setPickerSlot(slotId);
  };

  const handlePickEmotion = (emotionId: string) => {
    if (!pickerSlot) return;
    setAssignments((prev) => ({ ...prev, [pickerSlot]: emotionId }));
    setPickerSlot(null);
  };

  const handleChangeFormation = (f: Formation) => {
    if (isCompleted) return;
    setSelectedFormation(f);
    setAssignments({});
    setPickerSlot(null);
  };

  const handleReset = () => {
    if (isCompleted) return;
    setAssignments({});
    setPickerSlot(null);
  };

  const buildLineupObject = () => {
    if (!selectedFormation) return {};
    const result: Record<string, string[]> = {};
    currentSlots.forEach((slot) => {
      if (!assignments[slot.id]) return;
      const emotion = getEmotion(assignments[slot.id]);
      if (!emotion) return;
      if (!result[slot.sector]) result[slot.sector] = [];
      result[slot.sector].push(emotion.label);
    });
    return result;
  };

  const handleConfirm = async () => {
    if (!user || !selectedFormation) return;
    if (Object.keys(assignments).length === 0) {
      toast.error("Escale pelo menos uma emoção!");
      return;
    }

    setSaving(true);
    setAnalyzingAI(true);
    setConfirmed(true);

    const lineup = buildLineupObject();

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "analyze-emotional-lineup",
        { body: { formation: selectedFormation.id, lineup } }
      );

      const analysis = fnError ? null : fnData?.analysis || null;
      setAiAnalysis(analysis);

      const { error: dbError } = await supabase
        .from("emotional_lineups" as any)
        .insert({
          user_id: user.id,
          entry_date: today,
          formation: selectedFormation.id,
          lineup,
          ai_analysis: analysis,
        } as any);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["emotional-lineup-today"] });
      toast.success("Escalação emocional registrada! ⚽🧠");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar escalação.");
      setConfirmed(false);
    } finally {
      setSaving(false);
      setAnalyzingAI(false);
    }
  };

  const placedIds = new Set(Object.values(assignments));
  const filledCount = Object.keys(assignments).length;

  if (loadingExisting) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <style>{pulseStyle}</style>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-primary" />
        <span className="text-card-foreground font-bold font-sans">
          Prancheta Emocional
        </span>
      </div>

      {/* Formation Selection - always visible */}
      <div className="mb-4">
        <p className="text-muted-foreground text-sm mb-3">
          {isCompleted
            ? `Sua escalação de hoje — ${selectedFormation?.label ?? ""}`
            : "Escolha sua formação tática:"}
        </p>

        {/* Offensive */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Swords className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Ofensivas</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {formations.filter((f) => f.type === "ofensiva").map((f) => (
              <button
                key={f.id}
                onClick={() => handleChangeFormation(f)}
                disabled={isCompleted}
                className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  selectedFormation?.id === f.id
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : isCompleted
                    ? "bg-muted/50 text-muted-foreground border-border cursor-not-allowed"
                    : "bg-muted text-card-foreground border-border hover:border-secondary hover:bg-secondary/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Defensive */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Defensivas</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {formations.filter((f) => f.type === "defensiva").map((f) => (
              <button
                key={f.id}
                onClick={() => handleChangeFormation(f)}
                disabled={isCompleted}
                className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  selectedFormation?.id === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : isCompleted
                    ? "bg-muted/50 text-muted-foreground border-border cursor-not-allowed"
                    : "bg-muted text-card-foreground border-border hover:border-primary hover:bg-primary/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Football Pitch - always visible */}
      <div
        className="relative w-full rounded-xl overflow-hidden border-2 border-border"
        style={{
          aspectRatio: "3/4",
          background:
            "linear-gradient(180deg, #2d8a4e 0%, #34a058 8%, #2d8a4e 16%, #34a058 24%, #2d8a4e 32%, #34a058 40%, #2d8a4e 48%, #34a058 56%, #2d8a4e 64%, #34a058 72%, #2d8a4e 80%, #34a058 88%, #2d8a4e 96%)",
        }}
      >
        {/* Pitch markings */}
        <svg
          viewBox="0 0 300 400"
          className="absolute inset-0 w-full h-full"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
        >
          <rect x="10" y="10" width="280" height="380" rx="2" />
          <line x1="10" y1="200" x2="290" y2="200" />
          <circle cx="150" cy="200" r="40" />
          <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.7)" />
          <rect x="70" y="10" width="160" height="65" />
          <rect x="105" y="10" width="90" height="30" />
          <path d="M 110 75 Q 150 95 190 75" />
          <circle cx="150" cy="55" r="2.5" fill="rgba(255,255,255,0.7)" />
          <rect x="70" y="325" width="160" height="65" />
          <rect x="105" y="360" width="90" height="30" />
          <path d="M 110 325 Q 150 305 190 325" />
          <circle cx="150" cy="345" r="2.5" fill="rgba(255,255,255,0.7)" />
          <path d="M 10 18 Q 18 18 18 10" />
          <path d="M 282 10 Q 282 18 290 18" />
          <path d="M 10 382 Q 18 382 18 390" />
          <path d="M 282 390 Q 282 382 290 382" />
          <rect x="120" y="2" width="60" height="8" strokeDasharray="4 3" />
          <rect x="120" y="390" width="60" height="8" strokeDasharray="4 3" />
        </svg>

        {/* Formation slots */}
        {currentSlots.map((slot) => {
          const emotion = assignments[slot.id] ? getEmotion(assignments[slot.id]) : null;
          const isActive = slot.id === activeSlotId && !pickerSlot;
          return (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot.id)}
              className="absolute flex flex-col items-center"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
                ...(isActive
                  ? { animation: "slotGrow 2s ease-in-out infinite" }
                  : {}),
              }}
            >
              {emotion ? (
                <>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 border-white/80 bg-white/90 shadow-md">
                    {emotion.icon}
                  </div>
                  <span className="text-[9px] text-white font-bold mt-0.5 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {emotion.label}
                  </span>
                </>
              ) : (
                <div
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    isActive
                      ? "border-white bg-white/25 cursor-pointer"
                      : "border-dashed border-white/30 bg-white/5"
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* No formation selected placeholder */}
        {!selectedFormation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/50 text-sm font-medium">Selecione uma formação acima</span>
          </div>
        )}

        {/* Emotion Picker Overlay */}
        {pickerSlot && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl p-4 mx-4 max-h-[85%] overflow-y-auto w-full max-w-xs shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-card-foreground text-sm">Escolha uma emoção</span>
                <button onClick={() => setPickerSlot(null)} className="p-1 rounded-full hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs font-bold text-secondary mb-1.5 px-0.5">✅ Positivas</p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {positiveEmotions.map((em) => {
                  const isPlaced = placedIds.has(em.id);
                  return (
                    <button
                      key={em.id}
                      onClick={() => handlePickEmotion(em.id)}
                      disabled={isPlaced}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm border transition-all ${
                        isPlaced
                          ? "bg-muted/40 text-muted-foreground border-border opacity-40 line-through"
                          : "bg-card text-card-foreground border-border hover:border-secondary/50 hover:bg-secondary/5"
                      }`}
                    >
                      <span className="text-base">{em.icon}</span>
                      <span className="text-xs font-medium">{em.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-destructive mb-1.5 px-0.5">⛔ Negativas</p>
              <div className="grid grid-cols-2 gap-1.5">
                {negativeEmotions.map((em) => {
                  const isPlaced = placedIds.has(em.id);
                  return (
                    <button
                      key={em.id}
                      onClick={() => handlePickEmotion(em.id)}
                      disabled={isPlaced}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm border transition-all ${
                        isPlaced
                          ? "bg-muted/40 text-muted-foreground border-border opacity-40 line-through"
                          : "bg-card text-card-foreground border-border hover:border-destructive/50 hover:bg-destructive/5"
                      }`}
                    >
                      <span className="text-base">{em.icon}</span>
                      <span className="text-xs font-medium">{em.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {selectedFormation && filledCount > 0 && !isCompleted && (
        <p className="text-muted-foreground text-xs text-center mt-2">
          {filledCount}/{currentSlots.length} posições preenchidas
        </p>
      )}

      {/* Actions */}
      {selectedFormation && !isCompleted && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
          <button
            onClick={handleConfirm}
            disabled={filledCount === 0 || saving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              filledCount > 0
                ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Confirmar Escalação"
            )}
          </button>
        </div>
      )}

      {/* AI Analysis Card */}
      {aiAnalysis && (
        <div className="mt-5 bg-muted border border-border rounded-2xl p-5">
          <h3 className="text-card-foreground font-bold text-base mb-1 flex items-center gap-2">
            ⚽ Análise da sua escalação hoje
          </h3>
          <div className="text-card-foreground text-base leading-relaxed mt-3 space-y-3">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-card-foreground text-base leading-relaxed mb-3">{children}</p>,
                blockquote: ({ children }) => (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CloudLightning className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">Para refletir</span>
                    </div>
                    <blockquote className="text-card-foreground text-base italic leading-relaxed">{children}</blockquote>
                  </div>
                ),
              }}
            >{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {analyzingAI && !aiAnalysis && (
        <div className="mt-5 bg-muted border border-border rounded-2xl p-5 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Analisando sua escalação...</span>
        </div>
      )}
    </div>
  );
};

export default EmotionTacticalBoard;
