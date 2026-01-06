import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TherapistCard from "@/components/terapeutas/TherapistCard";
import { getClubsByLeague, BrazilianClub } from "@/data/brazilianClubs";
import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";

interface Professional {
  id: string;
  user_id: string;
  crp: string;
  degree: string | null;
  experience_years: number | null;
  location: string | null;
  specialties: string[] | null;
  is_verified: boolean | null;
  bio: string | null;
  hourly_rate: number | null;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  favorite_club_id: string | null;
}

interface TherapistData {
  id: string;
  name: string;
  crp: string;
  degree: string;
  experience: number;
  location: string;
  specialties: string[];
  verified: boolean;
  imageUrl?: string;
  availableSlots: { date: Date; times: string[] }[];
  hourlyRate?: number;
  bio?: string;
}

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

type Step = "club" | "therapists";

const Terapeutas = () => {
  const [step, setStep] = useState<Step>("club");
  const [selectedClub, setSelectedClub] = useState<BrazilianClub | null>(null);
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [loading, setLoading] = useState(false);

  const clubs = getClubsByLeague("serie_a");

  const fetchTherapistsForClub = async (clubId: string) => {
    setLoading(true);
    try {
      // Buscar profissionais ativos E aprovados cujo perfil tem o clube favorito selecionado
      const { data: professionals, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('Erro ao buscar profissionais:', error);
        setTherapists([]);
        return;
      }

      if (!professionals || professionals.length === 0) {
        setTherapists([]);
        return;
      }

      // Buscar perfis dos profissionais com o clube selecionado
      const userIds = professionals.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, favorite_club_id')
        .in('user_id', userIds)
        .eq('favorite_club_id', clubId);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        setTherapists([]);
        return;
      }

      // Mapear profissionais com seus perfis
      const therapistData: TherapistData[] = [];
      
      for (const profile of (profiles || [])) {
        const professional = professionals.find(p => p.user_id === profile.user_id);
        if (professional) {
          therapistData.push({
            id: professional.id,
            name: profile.full_name || 'Profissional',
            crp: professional.crp,
            degree: professional.degree || 'Psicólogo(a)',
            experience: professional.experience_years || 0,
            location: professional.location || 'Brasil',
            specialties: professional.specialties || [],
            verified: professional.is_verified || false,
            imageUrl: profile.avatar_url || undefined,
            availableSlots: generateAvailableSlots(),
            hourlyRate: professional.hourly_rate || undefined,
            bio: professional.bio || undefined,
          });
        }
      }

      setTherapists(therapistData);
    } catch (err) {
      console.error('Erro:', err);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (club: BrazilianClub) => {
    setSelectedClub(club);
    setStep("therapists");
    fetchTherapistsForClub(club.id);
  };

  const handleBack = () => {
    setStep("club");
    setSelectedClub(null);
    setTherapists([]);
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

      <main className="pt-20 px-4">
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

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : therapists.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground text-lg mb-2">
                  Nenhum terapeuta disponível ainda
                </p>
                <p className="text-muted-foreground text-sm">
                  Em breve teremos profissionais para a torcida do {selectedClub.name}
                </p>
              </div>
            ) : (
              therapists.map((therapist) => (
                <TherapistCard
                  key={therapist.id}
                  therapist={therapist}
                  clubColor={selectedClub.primaryColor}
                  clubSecondaryColor={selectedClub.secondaryColor}
                />
              ))
            )}
          </div>
        )}

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Terapeutas;
