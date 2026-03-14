import { useState } from "react";
import { ClipboardList, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

// 1-2-3-2-3 formation slots
const formationSlots = [
  { id: "gk", x: 50, y: 90, role: "GOL" },
  { id: "def-l", x: 25, y: 75, role: "ZAG" },
  { id: "def-r", x: 75, y: 75, role: "ZAG" },
  { id: "mid-l", x: 20, y: 55, role: "MEI" },
  { id: "mid-c", x: 50, y: 50, role: "MEI" },
  { id: "mid-r", x: 80, y: 55, role: "MEI" },
  { id: "mid2-l", x: 30, y: 35, role: "MEI" },
  { id: "mid2-r", x: 70, y: 35, role: "MEI" },
  { id: "atk-l", x: 20, y: 18, role: "ATA" },
  { id: "atk-c", x: 50, y: 12, role: "ATA" },
  { id: "atk-r", x: 80, y: 18, role: "ATA" },
];

interface SlotAssignment {
  [slotId: string]: string; // slotId -> emotionId
}

const BenchIcon = ({ type }: { type: "positive" | "negative" }) => (
  <svg viewBox="0 0 80 50" className="w-full h-full" fill="none">
    {/* Bench seat */}
    <rect x="5" y="15" width="70" height="8" rx="3"
      fill={type === "positive" ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
      opacity="0.9"
    />
    {/* Back rest */}
    <rect x="8" y="5" width="64" height="10" rx="3"
      fill={type === "positive" ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
      opacity="0.7"
    />
    {/* Legs */}
    <rect x="10" y="23" width="4" height="20" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6" />
    <rect x="36" y="23" width="4" height="20" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6" />
    <rect x="66" y="23" width="4" height="20" rx="1" fill="hsl(var(--muted-foreground))" opacity="0.6" />
    {/* 3 person silhouettes sitting */}
    {[18, 38, 58].map((cx, i) => (
      <g key={i}>
        <circle cx={cx} cy="2" r="4" fill="hsl(var(--muted-foreground))" opacity="0.5" />
      </g>
    ))}
  </svg>
);

const EmotionTacticalBoard = () => {
  const [assignments, setAssignments] = useState<SlotAssignment>({});
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [negOpen, setNegOpen] = useState(false);

  const handleSelectEmotion = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    setPosOpen(false);
    setNegOpen(false);
  };

  const handleSlotClick = (slotId: string) => {
    if (saved) return;
    // If slot is occupied, remove it
    if (assignments[slotId]) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      return;
    }
    // If we have a selected emotion, place it
    if (selectedEmotion) {
      setAssignments((prev) => ({ ...prev, [slotId]: selectedEmotion }));
      setSelectedEmotion(null);
    }
  };

  const handleReset = () => {
    setAssignments({});
    setSelectedEmotion(null);
    setSaved(false);
  };

  const handleSave = () => {
    if (Object.keys(assignments).length === 0) {
      toast.error("Coloque pelo menos uma emoção em campo!");
      return;
    }
    setSaved(true);
    toast.success("Prancheta emocional salva! ⚽🧠");
  };

  const getEmotion = (id: string) => allEmotions.find((e) => e.id === id);
  const placedIds = new Set(Object.values(assignments));

  const renderEmotionList = (emotions: typeof positiveEmotions) => (
    <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto p-1">
      {emotions.map((em) => {
        const isPlaced = placedIds.has(em.id);
        const isSelected = selectedEmotion === em.id;
        return (
          <button
            key={em.id}
            onClick={() => handleSelectEmotion(em.id)}
            disabled={isPlaced || saved}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm transition-all border ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : isPlaced
                ? "bg-muted/40 text-muted-foreground border-border opacity-40 line-through"
                : "bg-card text-card-foreground border-border hover:border-primary/50"
            }`}
          >
            <span className="text-base">{em.icon}</span>
            <span className="text-xs font-medium">{em.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-5 h-5 text-primary" />
        <span className="text-card-foreground font-bold font-sans">
          Prancheta Emocional
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Escolha emoções nos bancos e posicione nos círculos do campo!
      </p>

      {/* Benches */}
      <div className="flex gap-3 mb-4">
        <Popover open={posOpen} onOpenChange={setPosOpen}>
          <PopoverTrigger asChild>
            <button className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all">
              <div className="w-16 h-10">
                <BenchIcon type="positive" />
              </div>
              <span className="text-xs font-bold text-primary">Positivas</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <p className="text-xs font-bold text-primary mb-2 px-1">Emoções Positivas</p>
            {renderEmotionList(positiveEmotions)}
          </PopoverContent>
        </Popover>

        <Popover open={negOpen} onOpenChange={setNegOpen}>
          <PopoverTrigger asChild>
            <button className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all">
              <div className="w-16 h-10">
                <BenchIcon type="negative" />
              </div>
              <span className="text-xs font-bold text-destructive">Negativas</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="end">
            <p className="text-xs font-bold text-destructive mb-2 px-1">Emoções Negativas</p>
            {renderEmotionList(negativeEmotions)}
          </PopoverContent>
        </Popover>
      </div>

      {selectedEmotion && (
        <p className="text-primary text-xs font-medium mb-2 animate-pulse text-center">
          👆 Toque num círculo para posicionar: {getEmotion(selectedEmotion)?.icon} {getEmotion(selectedEmotion)?.label}
        </p>
      )}

      {/* Football Pitch */}
      <div
        className={`relative w-full rounded-xl overflow-hidden border-2 transition-all ${
          selectedEmotion ? "border-primary shadow-lg shadow-primary/20" : "border-border"
        }`}
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
        {formationSlots.map((slot) => {
          const emotion = assignments[slot.id] ? getEmotion(assignments[slot.id]) : null;
          return (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot.id)}
              className="absolute flex flex-col items-center transition-all duration-200"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {emotion ? (
                <>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white/80 bg-white/90 animate-in zoom-in-50">
                    {emotion.icon}
                  </div>
                  <span className="text-[9px] text-white font-bold mt-0.5 drop-shadow-md bg-black/50 px-1.5 py-0.5 rounded">
                    {emotion.label}
                  </span>
                </>
              ) : (
                <div
                  className={`w-10 h-10 rounded-full border-2 border-dashed transition-all ${
                    selectedEmotion
                      ? "border-white/90 bg-white/20 animate-pulse cursor-pointer"
                      : "border-white/40 bg-white/10"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar
        </button>
        <button
          onClick={handleSave}
          disabled={Object.keys(assignments).length === 0 || saved}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            saved
              ? "bg-secondary text-secondary-foreground"
              : Object.keys(assignments).length > 0
              ? "bg-primary text-primary-foreground hover:scale-[1.02]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Salvo!
            </>
          ) : (
            "Confirmar Escalação"
          )}
        </button>
      </div>
    </div>
  );
};

export default EmotionTacticalBoard;
