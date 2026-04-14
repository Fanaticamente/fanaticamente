import { useState, useEffect } from "react";
import { ClipboardList, RotateCcw, Loader2, Swords, Shield, X, CloudLightning } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

/* ── Emoji imports ── */
import emojiAlegre from "@/assets/emojis/alegre.png";
import emojiEuforico from "@/assets/emojis/euforico.png";
import emojiFeliz from "@/assets/emojis/feliz.png";
import emojiConfiante from "@/assets/emojis/confiante.png";
import emojiEmpolgado from "@/assets/emojis/empolgado.png";
import emojiOrgulhoso from "@/assets/emojis/orgulhoso.png";
import emojiEsperancoso from "@/assets/emojis/esperancoso.png";
import emojiGrato from "@/assets/emojis/grato.png";
import emojiAliviado from "@/assets/emojis/aliviado.png";
import emojiInspirado from "@/assets/emojis/inspirado.png";
import emojiMotivado from "@/assets/emojis/motivado.png";
import emojiTriste from "@/assets/emojis/triste.png";
import emojiRaiva from "@/assets/emojis/raiva.png";
import emojiAnsioso from "@/assets/emojis/ansioso.png";
import emojiDecepcionado from "@/assets/emojis/decepcionado.png";
import emojiMedo from "@/assets/emojis/medo.png";
import emojiIrritado from "@/assets/emojis/irritado.png";
import emojiDesanimado from "@/assets/emojis/desanimado.png";
import emojiImpaciente from "@/assets/emojis/impaciente.png";
import emojiFrustrado from "@/assets/emojis/frustrado.png";
import emojiInseguro from "@/assets/emojis/inseguro.png";
import emojiEnvergonhado from "@/assets/emojis/envergonhado.png";

/* ── Emotions with gender support ── */
interface EmotionDef {
  id: string;
  img: string;
  labelM: string;
  labelF: string;
}

const positiveEmotions: EmotionDef[] = [
  { id: "alegre", img: emojiAlegre, labelM: "Alegre", labelF: "Alegre" },
  { id: "euforico", img: emojiEuforico, labelM: "Eufórico", labelF: "Eufórica" },
  { id: "feliz", img: emojiFeliz, labelM: "Feliz", labelF: "Feliz" },
  { id: "confiante", img: emojiConfiante, labelM: "Confiante", labelF: "Confiante" },
  { id: "empolgado", img: emojiEmpolgado, labelM: "Empolgado", labelF: "Empolgada" },
  { id: "orgulhoso", img: emojiOrgulhoso, labelM: "Orgulhoso", labelF: "Orgulhosa" },
  { id: "esperancoso", img: emojiEsperancoso, labelM: "Esperançoso", labelF: "Esperançosa" },
  { id: "grato", img: emojiGrato, labelM: "Grato", labelF: "Grata" },
  { id: "aliviado", img: emojiAliviado, labelM: "Aliviado", labelF: "Aliviada" },
  { id: "inspirado", img: emojiInspirado, labelM: "Inspirado", labelF: "Inspirada" },
  { id: "motivado", img: emojiMotivado, labelM: "Motivado", labelF: "Motivada" },
];

const negativeEmotions: EmotionDef[] = [
  { id: "triste", img: emojiTriste, labelM: "Triste", labelF: "Triste" },
  { id: "raiva", img: emojiRaiva, labelM: "Com Raiva", labelF: "Com Raiva" },
  { id: "ansioso", img: emojiAnsioso, labelM: "Ansioso", labelF: "Ansiosa" },
  { id: "decepcionado", img: emojiDecepcionado, labelM: "Decepcionado", labelF: "Decepcionada" },
  { id: "medo", img: emojiMedo, labelM: "Com Medo", labelF: "Com Medo" },
  { id: "irritado", img: emojiIrritado, labelM: "Irritado", labelF: "Irritada" },
  { id: "desanimado", img: emojiDesanimado, labelM: "Desanimado", labelF: "Desanimada" },
  { id: "impaciente", img: emojiImpaciente, labelM: "Impaciente", labelF: "Impaciente" },
  { id: "frustrado", img: emojiFrustrado, labelM: "Frustrado", labelF: "Frustrada" },
  { id: "inseguro", img: emojiInseguro, labelM: "Inseguro", labelF: "Insegura" },
  { id: "envergonhado", img: emojiEnvergonhado, labelM: "Envergonhado", labelF: "Envergonhada" },
];

const allEmotions = [...positiveEmotions, ...negativeEmotions];
const getEmotion = (id: string) => allEmotions.find((e) => e.id === id);
const getLabel = (em: EmotionDef, gender: string) =>
  gender === "feminino" ? em.labelF : em.labelM;

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

/* ── Helper: split analysis into body + philosophical quote ── */
const splitAnalysis = (text: string) => {
  const lines = text.split("\n").filter((l) => l.trim());
  // Look for the philosophical quote — typically contains em-dash and quotes
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.includes("—") || line.includes("–")) {
      // Check if previous line is part of the quote too
      let quoteStart = i;
      if (i > 0 && (lines[i - 1].startsWith('"') || lines[i - 1].startsWith('"') || lines[i - 1].startsWith(">"))) {
        quoteStart = i - 1;
      }
      const body = lines.slice(0, quoteStart).join("\n\n");
      const quote = lines.slice(quoteStart).join("\n");
      return { body, quote };
    }
  }
  return { body: text, quote: null };
};

/* ── Component ── */
const ANON_LINEUP_KEY = "anon-emotional-lineup";

const EmotionTacticalBoard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  /* Fetch user profile for gender + club */
  const { data: profile } = useQuery({
    queryKey: ["profile-tactical", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("gender, favorite_club_id")
        .eq("user_id", user!.id)
        .single();
      return data as any;
    },
    enabled: !!user,
  });

  /* Fetch club colors */
  const { data: club } = useQuery({
    queryKey: ["club-colors", profile?.favorite_club_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clubs")
        .select("primary_color, secondary_color")
        .eq("id", profile!.favorite_club_id!)
        .single();
      return data;
    },
    enabled: !!profile?.favorite_club_id,
  });

  const gender: string = (profile?.gender as string) || "masculino";
  const teamColor = club?.primary_color || "#D4A017";

  /* For logged-in users: fetch from DB */
  const { data: existingLineupDB, isLoading: loadingExistingDB } = useQuery({
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

  /* For anonymous users: fetch from localStorage */
  const [anonLineup, setAnonLineup] = useState<any>(null);
  useEffect(() => {
    if (!user) {
      try {
        const stored = localStorage.getItem(ANON_LINEUP_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.entry_date === today) setAnonLineup(parsed);
          else localStorage.removeItem(ANON_LINEUP_KEY);
        }
      } catch {}
    }
  }, [user, today]);

  const existingLineup = user ? existingLineupDB : anonLineup;
  const loadingExisting = user ? loadingExistingDB : false;

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
              // Try matching by labelM first, then labelF, then id
              const emotionObj = allEmotions.find(
                (e) => e.labelM === em || e.labelF === em || e.id === em
              );
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
  const activeSlotId =
    !isCompleted && selectedFormation
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
      result[slot.sector].push(getLabel(emotion, gender));
    });
    return result;
  };

  const handleConfirm = async () => {
    if (!selectedFormation) return;
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

      if (user) {
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
      } else {
        // Save to localStorage for anonymous users
        const anonData = {
          entry_date: today,
          formation: selectedFormation.id,
          lineup,
          ai_analysis: analysis,
        };
        localStorage.setItem(ANON_LINEUP_KEY, JSON.stringify(anonData));
        setAnonLineup(anonData);
      }

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

  const filledCount = Object.keys(assignments).length;
...
                  {positiveEmotions.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => handlePickEmotion(em.id)}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs border transition-all bg-card text-card-foreground border-border hover:border-secondary/50 hover:bg-secondary/5"
                    >
                      <img src={em.img} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{getLabel(em, gender)}</span>
                    </button>
                  ))}
                </div>
 
                {/* Right column: negative */}
                <div className="space-y-1.5">
                  {negativeEmotions.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => handlePickEmotion(em.id)}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs border transition-all bg-card text-card-foreground border-border hover:border-destructive/50 hover:bg-destructive/5"
                    >
                      <img src={em.img} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{getLabel(em, gender)}</span>
                    </button>
                  ))}
                </div>
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
      {analysisData && (
        <div className="mt-5 bg-muted border border-border rounded-2xl p-5">
          <h3 className="text-card-foreground font-bold text-base mb-3 flex items-center gap-2">
            ⚽ Análise da sua escalação hoje
          </h3>

          {/* Main body */}
          <div className="text-card-foreground text-base leading-relaxed whitespace-pre-line">
            {analysisData.body}
          </div>

          {/* Philosophical quote with "Para refletir" subtitle */}
          {analysisData.quote && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <CloudLightning className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">
                  💭 Para refletir
                </span>
              </div>
              <p className="text-card-foreground text-base italic leading-relaxed">
                {analysisData.quote}
              </p>
            </div>
          )}
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
