import { useState } from "react";
import { Thermometer, Calendar, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface EmotionEntry {
  date: string;
  emotion: string;
  note: string;
}

const emotions = [
  { id: "muito-feliz", icon: "😄", label: "Muito Feliz", color: "bg-secondary" },
  { id: "feliz", icon: "🙂", label: "Feliz", color: "bg-secondary/70" },
  { id: "neutro", icon: "😐", label: "Neutro", color: "bg-primary" },
  { id: "triste", icon: "😢", label: "Triste", color: "bg-quiz" },
  { id: "muito-triste", icon: "😭", label: "Muito Triste", color: "bg-destructive" },
];

const previousEntries: EmotionEntry[] = [
  { date: "26 Dez", emotion: "feliz", note: "Meu time ganhou! 🎉" },
  { date: "25 Dez", emotion: "muito-feliz", note: "Natal em família assistindo futebol" },
  { date: "24 Dez", emotion: "neutro", note: "Dia tranquilo, sem jogos" },
  { date: "23 Dez", emotion: "triste", note: "Derrota difícil de aceitar" },
  { date: "22 Dez", emotion: "feliz", note: "Treino aberto do time" },
];

const Diario = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (selectedEmotion) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSelectedEmotion(null);
      setNote("");
    }
  };

  const getEmotionDetails = (id: string) => emotions.find((e) => e.id === id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-4">
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

        {/* Success Message */}
        {saved && (
          <div className="bg-secondary/20 border border-secondary rounded-2xl p-4 mb-6 text-center animate-fade-in">
            <p className="text-secondary font-bold">Registro salvo! ✅</p>
            <p className="text-secondary/80 text-sm">
              Continue acompanhando suas emoções
            </p>
          </div>
        )}

        {/* Today's Entry */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-card-foreground font-medium">
              Hoje, 27 de Dezembro
            </span>
          </div>

          <p className="text-muted-foreground text-sm mb-4">
            Toque na emoção que melhor descreve seu dia:
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
            disabled={!selectedEmotion}
            className={`w-full mt-4 py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${
              selectedEmotion
                ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Salvar Registro
          </button>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-card-foreground font-medium">
              Sua Semana
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-3xl text-secondary">3</p>
              <p className="text-muted-foreground text-xs">Dias Felizes</p>
            </div>
            <div>
              <p className="font-display text-3xl text-primary">1</p>
              <p className="text-muted-foreground text-xs">Dias Neutros</p>
            </div>
            <div>
              <p className="font-display text-3xl text-quiz">1</p>
              <p className="text-muted-foreground text-xs">Dias Tristes</p>
            </div>
          </div>
        </div>

        {/* Previous Entries */}
        <div>
          <h2 className="font-display text-xl text-card-foreground mb-4">
            Registros Anteriores
          </h2>

          <div className="space-y-3">
            {previousEntries.map((entry, index) => {
              const emotionDetails = getEmotionDetails(entry.emotion);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${emotionDetails?.color}`}
                  >
                    <span className="text-2xl">{emotionDetails?.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-card-foreground font-medium text-sm">
                      {entry.note}
                    </p>
                    <p className="text-muted-foreground text-xs">{entry.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Diario;
