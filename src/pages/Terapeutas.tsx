import { useState, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TherapistCard from "@/components/terapeutas/TherapistCard";
import VacancyCard from "@/components/terapeutas/VacancyCard";
import BookingDrawer from "@/components/terapeutas/BookingDrawer";
import { getClubsByLeague, BrazilianClub } from "@/data/brazilianClubs";
import { clubNicknames } from "@/data/clubNicknames";
import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopTerapeutasPage from "@/components/desktop/DesktopTerapeutasPage";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import ClubMark from "@/components/clubs/ClubMark";

interface Professional {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  favorite_club_id: string | null;
  crp: string;
  degree: string | null;
  experience_years: number | null;
  location: string | null;
  specialties: string[] | null;
  is_verified: boolean | null;
  bio: string | null;
  hourly_rate: number | null;
  socio_consciente: boolean | null;
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
  socioConsciente?: boolean;
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
type League = "serie_a" | "serie_b" | "serie_c";

const leagueLabels: Record<League, string> = {
  serie_a: "Série A",
  serie_b: "Série B",
  serie_c: "Série C",
};

const Terapeutas = () => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>("club");
  const [selectedLeague, setSelectedLeague] = useState<League>("serie_a");
  const [selectedClub, setSelectedClub] = useState<BrazilianClub | null>(null);
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { data: moduleConfig } = useModuleConfig("therapists_page");
  const showBadges = moduleConfig?.config?.show_badges !== false;
  const hiddenBadges = (moduleConfig?.config?.hidden_badges as string[]) || [];
  const clubDisplayMode = ((moduleConfig?.config?.club_display_mode as string) || "badge") as "badge" | "flag";
  
  // Booking drawer state
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clubsWithProfessionals, setClubsWithProfessionals] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchClubsWithProfessionals = async () => {
      const { data: professionals, error: profError } = await supabase
        .from('professionals_public')
        .select('favorite_club_id')
        .eq('approval_status', 'approved')
        .not('favorite_club_id', 'is', null);

      if (profError || !professionals?.length) {
        setClubsWithProfessionals(new Set());
        return;
      }

      const clubIds = new Set(
        professionals
          .map(p => p.favorite_club_id)
          .filter((id): id is string => Boolean(id))
      );
      setClubsWithProfessionals(clubIds);
    };

    fetchClubsWithProfessionals();
  }, []);

  const clubs = useMemo(() => {
    const leagueClubs = getClubsByLeague(selectedLeague);
    return [...leagueClubs].sort((a, b) => {
      const aHasProfessionals = clubsWithProfessionals.has(a.id) ? 1 : 0;
      const bHasProfessionals = clubsWithProfessionals.has(b.id) ? 1 : 0;
      if (aHasProfessionals !== bHasProfessionals) {
        return bHasProfessionals - aHasProfessionals;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [selectedLeague, clubsWithProfessionals]);

  // Render desktop version
  if (!isMobile) {
    return <DesktopTerapeutasPage showBadges={showBadges} hiddenBadges={hiddenBadges} clubDisplayMode={clubDisplayMode} />;
  }

  const fetchTherapistsForClub = async (clubId: string) => {
    setLoading(true);
    try {
      // Usando VIEW pública segura que não expõe dados sensíveis
      const { data: professionals, error } = await supabase
        .from('professionals_public')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('favorite_club_id', clubId);

      if (error) {
        console.error('Erro ao buscar profissionais:', error);
        setTherapists([]);
        return;
      }

      if (!professionals || professionals.length === 0) {
        setTherapists([]);
        return;
      }

      const therapistData: TherapistData[] = [];
      
      for (const professional of professionals) {
        if (professional.id) {
          therapistData.push({
            id: professional.id,
            name: professional.full_name || 'Profissional',
            crp: professional.crp || '--',
            degree: professional.degree || 'Psicólogo(a)',
            experience: professional.experience_years || 0,
            location: professional.location || 'Brasil',
            specialties: professional.specialties || [],
            verified: professional.is_verified || false,
            imageUrl: professional.avatar_url || undefined,
            availableSlots: generateAvailableSlots(),
            hourlyRate: professional.hourly_rate || undefined,
            bio: professional.bio || undefined,
            socioConsciente: professional.socio_consciente || false,
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

  const handleTherapistSelect = (therapist: TherapistData) => {
    setSelectedTherapist(therapist);
    setDrawerOpen(true);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: selectedClub 
          ? "#f5f5f5"
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
            <div className="text-center mb-6">
              <h1 className="font-display text-3xl text-primary italic mx-auto">
                SELECIONE SEU TIME
              </h1>
              <p className="text-muted-foreground">
                Escolha seu time do coração
              </p>
            </div>

            {/* League Tabs */}
            <div className="flex gap-2 mb-6">
              {(Object.keys(leagueLabels) as League[]).map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all",
                    selectedLeague === league
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {leagueLabels[league]}
                </button>
              ))}
            </div>

            {/* Clubs Grid */}
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
                  {showBadges && !hiddenBadges.includes(club.id) && (
                    <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white p-1.5 shadow-md group-hover:shadow-lg transition-shadow overflow-hidden flex items-center justify-center">
                      <div className="w-11 h-11 flex items-center justify-center">
                        <ClubMark clubId={club.id} mode={clubDisplayMode} />
                      </div>
                    </div>
                  )}
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
            <div 
              className="rounded-2xl p-6 mb-6 flex items-center gap-4"
              style={{ 
                background: `linear-gradient(135deg, ${selectedClub.primaryColor}20 0%, ${selectedClub.secondaryColor}10 100%)`,
                borderLeft: `4px solid ${selectedClub.primaryColor}`
              }}
            >
              {showBadges && selectedClub && !hiddenBadges.includes(selectedClub.id) && (
                <div className="w-16 h-16 rounded-full bg-white p-2 shadow-lg overflow-hidden flex items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <ClubMark clubId={selectedClub.id} mode={clubDisplayMode} />
                  </div>
                </div>
              )}
              <div>
                <h1 
                  className="font-display text-3xl italic uppercase"
                  style={{ color: selectedClub.primaryColor }}
                >
                  {selectedClub.name}
                </h1>
                <p className="text-muted-foreground">
                  Especialistas para a torcida
                </p>
              </div>
            </div>

            <h2 
              className="font-sans font-bold text-xl mb-4 text-gray-800"
            >
              Terapeutas Disponíveis
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {therapists.map((therapist) => (
                  <TherapistCard
                    key={therapist.id}
                    therapist={{...therapist, clubNickname: selectedClub ? clubNicknames[selectedClub.id] : undefined}}
                    clubColor={selectedClub.primaryColor}
                    clubSecondaryColor={selectedClub.secondaryColor}
                    onSelect={handleTherapistSelect}
                  />
                ))}
                {[0, 1, 2, 3].map((i) => (
                  <VacancyCard
                    key={`vacancy-${i}`}
                    index={i}
                    clubColor={selectedClub.primaryColor}
                    clubName={selectedClub.name}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />

      {/* Booking Drawer */}
      <BookingDrawer
        therapist={selectedTherapist}
        clubColor={selectedClub?.primaryColor || "#10b981"}
        clubNickname={selectedClub ? clubNicknames[selectedClub.id] : undefined}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Terapeutas;
