import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Shirt } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TherapistCard from "@/components/terapeutas/TherapistCard";
import VacancyCard from "@/components/terapeutas/VacancyCard";
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
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [step, setStep] = useState<Step>("club");
  const [selectedLeague, setSelectedLeague] = useState<League>("serie_a");
  const [selectedClub, setSelectedClub] = useState<BrazilianClub | null>(null);
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { data: moduleConfig } = useModuleConfig("therapists_page");
  const showBadges = moduleConfig?.config?.show_badges !== false;
  const hiddenBadges = (moduleConfig?.config?.hidden_badges as string[]) || [];
  const clubDisplayMode = ((moduleConfig?.config?.club_display_mode as string) || "badge") as "badge" | "flag";
  
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

  // Restore selected club when coming back from booking page
  useEffect(() => {
    const state = routerLocation.state as { clubId?: string } | null;
    if (state?.clubId && step === "club") {
      const league = (["serie_a","serie_b","serie_c"] as League[]).find((l) =>
        getClubsByLeague(l).some((c) => c.id === state.clubId)
      );
      const club = league ? getClubsByLeague(league).find((c) => c.id === state.clubId) : null;
      if (club) {
        if (league) setSelectedLeague(league);
        handleClubSelect(club);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state]);

  const handleBack = () => {
    setStep("club");
    setSelectedClub(null);
    setTherapists([]);
  };

  const handleTherapistSelect = (therapist: TherapistData) => {
    navigate(`/agendar/${therapist.id}`, {
      state: {
        therapist,
        clubId: selectedClub?.id,
        clubColor: selectedClub?.primaryColor,
        clubName: selectedClub?.name,
        clubNickname: selectedClub ? clubNicknames[selectedClub.id] : undefined,
      },
    });
  };

  return (
    <div 
      className="min-h-screen font-sans transition-colors duration-500"
      style={{ 
        backgroundColor: selectedClub 
          ? "#ffffff"
          : "#ffffff" 
      }}
    >
      {step === "club" && <Header title="Terapeutas" />}

      {/* Full-width club header (mockup) */}
      {step === "therapists" && selectedClub && (
        <>
        <div
          aria-hidden
          className="fixed top-0 left-0 right-0 z-0 pointer-events-none"
          style={{ height: "env(safe-area-inset-top)", backgroundColor: selectedClub.primaryColor }}
        />
        <div
          className="relative overflow-hidden pb-8 px-4"
          style={{ backgroundColor: selectedClub.primaryColor, paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          {/* Star background pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0 2px, transparent 3px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0 1.5px, transparent 2.5px), radial-gradient(circle at 65% 70%, rgba(255,255,255,0.8) 0 2px, transparent 3px), radial-gradient(circle at 35% 85%, rgba(255,255,255,0.5) 0 1.5px, transparent 2.5px), radial-gradient(circle at 90% 55%, rgba(255,255,255,0.7) 0 2px, transparent 3px)",
              backgroundSize: "180px 180px",
            }}
          />
          <button
            onClick={handleBack}
            className="relative z-10 mb-4 text-white/90 hover:text-white"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center flex-shrink-0">
              <Shirt
                className="w-11 h-11"
                style={{ color: selectedClub.primaryColor, fill: selectedClub.primaryColor }}
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display italic text-3xl text-white leading-none tracking-wide uppercase">
                {selectedClub.name}
              </h1>
              <p className="mt-1 text-white/85 text-sm">Especialistas para a torcida</p>
            </div>
          </div>
        </div>
        </>
      )}

      <main className={step === "therapists" ? "px-4 pt-6" : "pt-16 px-5"}>
        {step === "club" && (
          <div className="animate-fade-in font-sans">
            <div className="relative mb-6">
              <div className="pr-24">
                <h1 className="font-sans font-bold text-[28px] leading-tight text-gray-900 normal-case">
                  Selecione <span className="text-emerald-500">seu time</span>
                </h1>
                <p className="mt-1 text-gray-500 text-[15px]">
                  Escolha o time do coração
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-50/60 flex items-center justify-center">
                <Shirt className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
              </div>
            </div>

            {/* League Tabs */}
            <div className="flex bg-white rounded-2xl p-1.5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {(Object.keys(leagueLabels) as League[]).map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all",
                    selectedLeague === league
                      ? "bg-white text-emerald-500 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                      : "bg-transparent text-gray-400"
                  )}
                >
                  {leagueLabels[league]}
                </button>
              ))}
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-3 gap-3">
              {clubs.map((club) => {
                const isSelected = selectedClub?.id === club.id;
                return (
                  <button
                    key={club.id}
                    onClick={() => handleClubSelect(club)}
                    className="bg-white border border-gray-100 rounded-2xl p-4 text-center transition-all hover:shadow-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] group"
                  >
                    {showBadges && !hiddenBadges.includes(club.id) && (
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                        <div className="w-11 h-11 flex items-center justify-center">
                          <ClubMark clubId={club.id} mode={clubDisplayMode} />
                        </div>
                      </div>
                    )}
                    <p
                      className={cn(
                        "font-medium text-[13px] leading-tight normal-case",
                        isSelected ? "text-emerald-500" : "text-gray-800"
                      )}
                    >
                      {club.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "therapists" && selectedClub && (
          <div className="animate-fade-in">
            <h2 className="font-sans font-bold text-2xl text-gray-900">
              Terapeutas Disponíveis
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Encontre o profissional ideal para você.
            </p>

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
                    clubBadgeUrl={selectedClub.badgeUrl}
                    clubName={selectedClub.name}
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
    </div>
  );
};

export default Terapeutas;
