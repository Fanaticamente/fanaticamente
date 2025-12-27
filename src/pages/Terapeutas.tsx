import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { addDays } from "date-fns";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TherapistCard from "@/components/terapeutas/TherapistCard";

const clubesSerieA = [
  { id: 1, name: "Flamengo", color: "#E32636" },
  { id: 2, name: "Palmeiras", color: "#006437" },
  { id: 3, name: "Corinthians", color: "#000000" },
  { id: 4, name: "São Paulo", color: "#FF0000" },
  { id: 5, name: "Fluminense", color: "#7B2D42" },
  { id: 6, name: "Botafogo", color: "#000000" },
  { id: 7, name: "Vasco", color: "#000000" },
  { id: 8, name: "Atlético-MG", color: "#000000" },
  { id: 9, name: "Cruzeiro", color: "#003DA5" },
  { id: 10, name: "Internacional", color: "#E30613" },
  { id: 11, name: "Grêmio", color: "#0A5EB6" },
  { id: 12, name: "Santos", color: "#000000" },
];

const clubesSerieB = [
  { id: 13, name: "Sport", color: "#E30613" },
  { id: 14, name: "Ceará", color: "#000000" },
  { id: 15, name: "Fortaleza", color: "#004A99" },
  { id: 16, name: "Bahia", color: "#004A99" },
  { id: 17, name: "Vitória", color: "#E30613" },
  { id: 18, name: "Guarani", color: "#006437" },
];

const generateAvailableSlots = () => {
  const slots = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const times = [];
    const randomTimes = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    const numSlots = Math.floor(Math.random() * 4) + 2;
    for (let j = 0; j < numSlots; j++) {
      const randomIndex = Math.floor(Math.random() * randomTimes.length);
      if (!times.includes(randomTimes[randomIndex])) {
        times.push(randomTimes[randomIndex]);
      }
    }
    if (times.length > 0) {
      slots.push({ date, times: times.sort() });
    }
  }
  return slots;
};

const terapeutasDemo = [
  {
    id: 1,
    name: "Dra. Ana Paula Silva",
    crp: "CRP 12345",
    degree: "Mestre em Psicologia",
    experience: 8,
    location: "São Paulo, SP",
    specialties: ["Ansiedade", "Terapia Cognitiva"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 2,
    name: "Dr. Carlos Eduardo Santos",
    crp: "CRP 67890",
    degree: "Especialista em Psicologia do Esporte",
    experience: 12,
    location: "Rio de Janeiro, RJ",
    specialties: ["Psicologia Esportiva", "Estresse"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 3,
    name: "Dra. Mariana Costa",
    crp: "CRP 11223",
    degree: "Doutora em Neurociências",
    experience: 15,
    location: "Belo Horizonte, MG",
    specialties: ["Depressão", "Traumas"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 4,
    name: "Dr. Fernando Lima",
    crp: "CRP 44556",
    degree: "Especialista em Terapia Familiar",
    experience: 10,
    location: "Porto Alegre, RS",
    specialties: ["Família", "Relacionamentos"],
    verified: false,
    availableSlots: generateAvailableSlots(),
  },
];

type Step = "league" | "club" | "therapists";

const Terapeutas = () => {
  const [step, setStep] = useState<Step>("league");
  const [selectedLeague, setSelectedLeague] = useState<"A" | "B" | null>(null);
  const [selectedClub, setSelectedClub] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);

  const handleLeagueSelect = (league: "A" | "B") => {
    setSelectedLeague(league);
    setStep("club");
  };

  const handleClubSelect = (club: { id: number; name: string; color: string }) => {
    setSelectedClub(club);
    setStep("therapists");
  };

  const handleBack = () => {
    if (step === "therapists") {
      setStep("club");
      setSelectedClub(null);
    } else if (step === "club") {
      setStep("league");
      setSelectedLeague(null);
    }
  };

  const clubs = selectedLeague === "A" ? clubesSerieA : clubesSerieB;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24 px-4">
        {step !== "league" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary mb-6 hover:underline"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
        )}

        {step === "league" && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl text-primary mb-2">
              Túnel de Acesso
            </h1>
            <p className="text-muted-foreground mb-8">
              Escolha a divisão do seu time
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleLeagueSelect("A")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <h2 className="font-display text-3xl text-card-foreground group-hover:text-primary transition-colors">
                  Série A
                </h2>
                <p className="text-muted-foreground">
                  Primeira divisão do futebol brasileiro
                </p>
              </button>

              <button
                onClick={() => handleLeagueSelect("B")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <h2 className="font-display text-3xl text-card-foreground group-hover:text-primary transition-colors">
                  Série B
                </h2>
                <p className="text-muted-foreground">
                  Segunda divisão do futebol brasileiro
                </p>
              </button>
            </div>
          </div>
        )}

        {step === "club" && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl text-primary mb-2">
              Série {selectedLeague}
            </h1>
            <p className="text-muted-foreground mb-8">Escolha seu time</p>

            <div className="grid grid-cols-2 gap-3">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleClubSelect(club)}
                  className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary transition-colors group"
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: club.color + "20" }}
                  >
                    ⚽
                  </div>
                  <p className="text-card-foreground font-medium text-sm">
                    {club.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "therapists" && selectedClub && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl text-primary mb-2">
              Terapeutas
            </h1>
            <p className="text-muted-foreground mb-8">
              Especialistas para torcedores do {selectedClub.name}
            </p>

            {terapeutasDemo.map((therapist) => (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                clubColor={selectedClub.color}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Terapeutas;
