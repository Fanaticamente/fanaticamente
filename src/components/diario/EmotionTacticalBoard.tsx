import { useState } from "react";
import { ClipboardList, RotateCcw, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

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

// 1-2-3-2-3 formation slots (order = sequence of blinking)
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
  [slotId: string]: string;
}

const EmotionTacticalBoard = () => {
  const [assignments, setAssignments] = useState<SlotAssignment>({});
  const [saved, setSaved] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);

  // Find the current active (blinking) slot = first unassigned slot in order
  const activeSlotId = !saved
    ? formationSlots.find((s) => !assignments[s.id])?.id ?? null
    : null;

  const handleSlotClick = (slotId: string) => {
    if (saved) return;
    // If clicking an already assigned slot, remove it and don't open picker
    if (assignments[slotId]) {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      return;
    }
    // Only allow clicking the active (blinking) slot
    if (slotId !== activeSlotId) return;
    setPickerSlot(slotId);
  };

  const handlePickEmotion = (emotionId: string) => {
    if (!pickerSlot) return;
    setAssignments((prev) => ({ ...prev, [pickerSlot]: emotionId }));
    setPickerSlot(null);
  };

  const handleReset = () => {
    setAssignments({});
    setPickerSlot(null);
    setSaved(false);
  };

  const handleSave = () => {
    if (Object.keys(assignments).length === 0) {
      toast.error("Coloque pelo menos uma emoção em campo!");
      return;
    }
    setSaved(true);
    setPickerSlot(null);
    toast.success("Prancheta emocional salva! ⚽🧠");
  };

  const handleSkip = () => {
    // Skip the current slot by closing picker without assigning
    // We actually need to mark it as skipped — we'll just close picker
    // and let user confirm with whatever they have
    setPickerSlot(null);
  };

  const getEmotion = (id: string) => allEmotions.find((e) => e.id === id);
  const placedIds = new Set(Object.values(assignments));
  const filledCount = Object.keys(assignments).length;

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
        Toque no círculo piscando para escalar sua emoção!
      </p>

      {/* Football Pitch */}
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
        {formationSlots.map((slot) => {
          const emotion = assignments[slot.id] ? getEmotion(assignments[slot.id]) : null;
          const isActive = slot.id === activeSlotId && !pickerSlot;
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
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    isActive
                      ? "border-white bg-white/30 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.6)] cursor-pointer"
                      : "border-dashed border-white/30 bg-white/5"
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Emotion Picker Overlay */}
        {pickerSlot && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl p-4 mx-4 max-h-[85%] overflow-y-auto w-full max-w-xs shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-card-foreground text-sm">Escolha uma emoção</span>
                <button onClick={handleSkip} className="p-1 rounded-full hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Positive */}
              <p className="text-xs font-bold text-primary mb-1.5 px-0.5">✅ Positivas</p>
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
                          : "bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-base">{em.icon}</span>
                      <span className="text-xs font-medium">{em.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Negative */}
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

      {/* Progress indicator */}
      {filledCount > 0 && !saved && (
        <p className="text-muted-foreground text-xs text-center mt-2">
          {filledCount}/11 posições preenchidas
        </p>
      )}

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
