import { useState, useRef, useCallback } from "react";
import { ClipboardList, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const emotionPieces = [
  { id: "muito-feliz", icon: "😄", label: "Muito Feliz", color: "#10b981" },
  { id: "feliz", icon: "🙂", label: "Feliz", color: "#34d399" },
  { id: "neutro", icon: "😐", label: "Neutro", color: "#eab308" },
  { id: "ansioso", icon: "😰", label: "Ansioso", color: "#f97316" },
  { id: "triste", icon: "😢", label: "Triste", color: "#ef4444" },
  { id: "irritado", icon: "😤", label: "Irritado", color: "#dc2626" },
  { id: "motivado", icon: "🔥", label: "Motivado", color: "#f59e0b" },
  { id: "tranquilo", icon: "😌", label: "Tranquilo", color: "#06b6d4" },
  { id: "confiante", icon: "💪", label: "Confiante", color: "#8b5cf6" },
  { id: "esperanca", icon: "⭐", label: "Esperança", color: "#fbbf24" },
  { id: "orgulho", icon: "🏆", label: "Orgulho", color: "#a855f7" },
];

interface PlacedEmotion {
  id: string;
  emotionId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

const EmotionTacticalBoard = () => {
  const [placedEmotions, setPlacedEmotions] = useState<PlacedEmotion[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);

  const handlePitchClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!selectedEmotion || !pitchRef.current) return;

      const rect = pitchRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      // Clamp
      const cx = Math.max(5, Math.min(95, x));
      const cy = Math.max(5, Math.min(95, y));

      setPlacedEmotions((prev) => [
        ...prev,
        { id: `${selectedEmotion}-${Date.now()}`, emotionId: selectedEmotion, x: cx, y: cy },
      ]);
      setSelectedEmotion(null);
    },
    [selectedEmotion]
  );

  const handleReset = () => {
    setPlacedEmotions([]);
    setSelectedEmotion(null);
    setSaved(false);
  };

  const handleSave = () => {
    if (placedEmotions.length === 0) {
      toast.error("Coloque pelo menos uma emoção em campo!");
      return;
    }
    setSaved(true);
    toast.success("Prancheta emocional salva! ⚽🧠");
  };

  const getEmotion = (id: string) => emotionPieces.find((e) => e.id === id);

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
        Selecione uma emoção abaixo e toque no campo para posicioná-la. Monte sua escalação emocional!
      </p>

      {/* Emotion pieces (bench) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emotionPieces.map((em) => {
          const isPlaced = placedEmotions.some((p) => p.emotionId === em.id);
          return (
            <button
              key={em.id}
              onClick={() => setSelectedEmotion(selectedEmotion === em.id ? null : em.id)}
              disabled={saved}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border ${
                selectedEmotion === em.id
                  ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg"
                  : isPlaced
                  ? "bg-muted/50 text-muted-foreground border-border opacity-60"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              <span className="text-base">{em.icon}</span>
              <span className="text-xs">{em.label}</span>
            </button>
          );
        })}
      </div>

      {selectedEmotion && (
        <p className="text-primary text-xs font-medium mb-2 animate-pulse text-center">
          👆 Agora toque no campo para posicionar: {getEmotion(selectedEmotion)?.icon} {getEmotion(selectedEmotion)?.label}
        </p>
      )}

      {/* Football Pitch */}
      <div
        ref={pitchRef}
        onClick={handlePitchClick}
        className={`relative w-full rounded-xl overflow-hidden border-2 transition-all ${
          selectedEmotion ? "border-primary shadow-lg shadow-primary/20 cursor-crosshair" : "border-border"
        }`}
        style={{
          aspectRatio: "3/4",
          background: "linear-gradient(180deg, #2d8a4e 0%, #34a058 8%, #2d8a4e 16%, #34a058 24%, #2d8a4e 32%, #34a058 40%, #2d8a4e 48%, #34a058 56%, #2d8a4e 64%, #34a058 72%, #2d8a4e 80%, #34a058 88%, #2d8a4e 96%)",
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
          {/* Border */}
          <rect x="10" y="10" width="280" height="380" rx="2" />
          {/* Center line */}
          <line x1="10" y1="200" x2="290" y2="200" />
          {/* Center circle */}
          <circle cx="150" cy="200" r="40" />
          {/* Center dot */}
          <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.7)" />
          {/* Top penalty area */}
          <rect x="70" y="10" width="160" height="65" />
          {/* Top goal area */}
          <rect x="105" y="10" width="90" height="30" />
          {/* Top penalty arc */}
          <path d="M 110 75 Q 150 95 190 75" />
          {/* Top penalty dot */}
          <circle cx="150" cy="55" r="2.5" fill="rgba(255,255,255,0.7)" />
          {/* Bottom penalty area */}
          <rect x="70" y="325" width="160" height="65" />
          {/* Bottom goal area */}
          <rect x="105" y="360" width="90" height="30" />
          {/* Bottom penalty arc */}
          <path d="M 110 325 Q 150 305 190 325" />
          {/* Bottom penalty dot */}
          <circle cx="150" cy="345" r="2.5" fill="rgba(255,255,255,0.7)" />
          {/* Corner arcs */}
          <path d="M 10 18 Q 18 18 18 10" />
          <path d="M 282 10 Q 282 18 290 18" />
          <path d="M 10 382 Q 18 382 18 390" />
          <path d="M 282 390 Q 282 382 290 382" />
          {/* Goals */}
          <rect x="120" y="2" width="60" height="8" strokeDasharray="4 3" />
          <rect x="120" y="390" width="60" height="8" strokeDasharray="4 3" />
        </svg>

        {/* Placed emotions */}
        {placedEmotions.map((placed) => {
          const em = getEmotion(placed.emotionId);
          if (!em) return null;
          return (
            <div
              key={placed.id}
              className="absolute flex flex-col items-center transition-all duration-300 animate-in zoom-in-50"
              style={{
                left: `${placed.x}%`,
                top: `${placed.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white/80"
                style={{ backgroundColor: em.color }}
              >
                {em.icon}
              </div>
              <span className="text-[10px] text-white font-bold mt-0.5 drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded">
                {em.label}
              </span>
            </div>
          );
        })}

        {/* Empty state */}
        {placedEmotions.length === 0 && !selectedEmotion && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/50 text-sm font-medium bg-black/30 px-4 py-2 rounded-xl">
              Selecione uma emoção e toque aqui
            </p>
          </div>
        )}
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
          disabled={placedEmotions.length === 0 || saved}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            saved
              ? "bg-secondary text-secondary-foreground"
              : placedEmotions.length > 0
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
