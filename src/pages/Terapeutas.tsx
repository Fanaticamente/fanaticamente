import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TherapistCard from "@/components/terapeutas/TherapistCard";
import { brazilianClubs, getClubsByLeague, BrazilianClub } from "@/data/brazilianClubs";
import { addDays } from "date-fns";

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
    crp: "CRP 06/12345",
    degree: "Mestre em Psicologia Clínica - USP",
    experience: 8,
    location: "São Paulo, SP",
    specialties: ["Ansiedade", "Terapia Cognitiva", "Saúde Mental no Esporte"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 2,
    name: "Dr. Carlos Eduardo Santos",
    crp: "CRP 05/67890",
    degree: "Especialista em Psicologia do Esporte",
    experience: 12,
    location: "Rio de Janeiro, RJ",
    specialties: ["Psicologia Esportiva", "Estresse", "Performance"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 3,
    name: "Dra. Mariana Costa",
    crp: "CRP 04/11223",
    degree: "Doutora em Neuropsicologia - UFMG",
    experience: 15,
    location: "Belo Horizonte, MG",
    specialties: ["Depressão", "Traumas", "Neuropsicologia"],
    verified: true,
    availableSlots: generateAvailableSlots(),
  },
  {
    id: 4,
    name: "Dr. Fernando Lima",
    crp: "CRP 07/44556",
    degree: "Especialista em Terapia Familiar",
    experience: 10,
    location: "Porto Alegre, RS",
    specialties: ["Família", "Relacionamentos", "Casais"],
    verified: false,
    availableSlots: generateAvailableSlots(),
  },
];

type Step = "club" | "therapists";

const Terapeutas = () => {
  const [step, setStep] = useState<Step>("club");
  const [selectedClub, setSelectedClub] = useState<BrazilianClub | null>(null);

  const clubs = getClubsByLeague("serie_a");

  const handleClubSelect = (club: BrazilianClub) => {
    setSelectedClub(club);
    setStep("therapists");
  };

  const handleBack = () => {
    setStep("club");
    setSelectedClub(null);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: selectedClub 
          ? `color-mix(in srgb, ${selectedClub.primaryColor} 5%, hsl(var(--background)))` 
          : "hsl(var(--background))" 
      }}
    >
      <Header />

      <main className="pt-20 pb-24 px-4">
        {step === "therapists" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 mb-6 hover:underline transition-colors"
            style={{ color: selectedClub?.primaryColor || "hsl(var(--primary))" }}
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
        )}

        {step === "club" && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="font-display text-4xl text-primary mb-2">
                Túnel de Acesso
              </h1>
              <p className="text-muted-foreground">
                Selecione seu time do coração
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleClubSelect(club)}
                  className="bg-card border-2 border-border rounded-xl p-3 text-center hover:scale-105 transition-all group"
                  style={{
                    "--hover-color": club.primaryColor,
                  } as React.CSSProperties}
                >
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white p-1 shadow-md group-hover:shadow-lg transition-shadow">
                    <img
                      src={club.badgeUrl}
                      alt={club.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/64?text=${club.shortName}`;
                      }}
                    />
                  </div>
                  <p className="text-card-foreground font-medium text-xs group-hover:text-primary transition-colors">
                    {club.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "therapists" && selectedClub && (
          <div className="animate-fade-in">
            {/* Club Header */}
            <div 
              className="rounded-2xl p-6 mb-6 flex items-center gap-4"
              style={{ 
                background: `linear-gradient(135deg, ${selectedClub.primaryColor}20 0%, ${selectedClub.secondaryColor}10 100%)`,
                borderLeft: `4px solid ${selectedClub.primaryColor}`
              }}
            >
              <div className="w-16 h-16 rounded-full bg-white p-2 shadow-lg">
                <img
                  src={selectedClub.badgeUrl}
                  alt={selectedClub.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/64?text=${selectedClub.shortName}`;
                  }}
                />
              </div>
              <div>
                <h1 
                  className="font-display text-3xl"
                  style={{ color: selectedClub.primaryColor }}
                >
                  {selectedClub.name}
                </h1>
                <p className="text-muted-foreground">
                  Especialistas para a nossa torcida
                </p>
              </div>
            </div>

            <h2 
              className="font-display text-xl mb-4"
              style={{ color: selectedClub.primaryColor }}
            >
              Terapeutas Disponíveis
            </h2>

            {terapeutasDemo.map((therapist) => (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                clubColor={selectedClub.primaryColor}
                clubSecondaryColor={selectedClub.secondaryColor}
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
