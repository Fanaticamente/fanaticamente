import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Star, MapPin, CheckCircle, Award, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface Professional {
  id: string;
  crp: string;
  bio: string | null;
  degree: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  specialties: string[] | null;
  is_verified: boolean | null;
  location: string | null;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  favorite_club_id: string | null;
}

interface Club {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string | null;
  badge_url: string | null;
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

const ProfessionalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots] = useState(generateAvailableSlots());
  const [showBioExpanded, setShowBioExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch professional
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', id)
          .single();
        
        if (profError || !profData) {
          console.error('Erro ao buscar profissional:', profError);
          navigate(-1);
          return;
        }
        
        setProfessional(profData);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, favorite_club_id')
          .eq('user_id', profData.user_id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          
          // Fetch club
          if (profileData.favorite_club_id) {
            const { data: clubData } = await supabase
              .from('clubs')
              .select('*')
              .eq('id', profileData.favorite_club_id)
              .single();
            
            if (clubData) {
              setClub(clubData);
            }
          }
        }
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const getAvailableTimesForDate = (date: Date) => {
    const slot = availableSlots.find((s) => isSameDay(s.date, date));
    return slot?.times || [];
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleSchedule = () => {
    if (selectedDate && selectedTime && profile) {
      alert(
        `Consulta agendada com ${profile.full_name} para ${format(
          selectedDate,
          "dd/MM/yyyy",
          { locale: ptBR }
        )} às ${selectedTime}`
      );
    }
  };

  const clubColor = club?.primary_color || "hsl(var(--primary))";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!professional || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profissional não encontrado</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: club 
          ? `color-mix(in srgb, ${club.primary_color} 5%, hsl(var(--background)))` 
          : "hsl(var(--background))" 
      }}
    >
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
        style={{ backgroundColor: clubColor }}
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-display text-xl">Perfil Profissional</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-20 pb-24 px-4">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex gap-4">
              {/* Photo */}
              <div 
                className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 border-2"
                style={{ borderColor: clubColor + "60" }}
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'Profissional'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-display text-2xl text-card-foreground">
                    {profile.full_name}
                  </h2>
                  {professional.is_verified && (
                    <CheckCircle className="w-5 h-5" style={{ color: clubColor }} />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{professional.degree || 'Psicólogo(a)'}</p>
                <p className="text-muted-foreground text-sm mb-3">CRP: {professional.crp}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ color: clubColor }} />
                    {professional.experience_years || 0} anos
                  </span>
                  {professional.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {professional.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hourly Rate */}
            {professional.hourly_rate && (
              <div 
                className="mt-4 inline-block px-4 py-2 rounded-full border-2"
                style={{ borderColor: clubColor, color: clubColor }}
              >
                <span className="font-bold text-lg">
                  R$ {professional.hourly_rate.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm"> / sessão</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {professional.bio && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5" style={{ color: clubColor }} />
              <h3 className="font-display text-lg text-card-foreground">Sobre mim</h3>
            </div>
            <p className={`text-muted-foreground ${!showBioExpanded ? 'line-clamp-3' : ''}`}>
              {professional.bio}
            </p>
            {professional.bio.length > 150 && (
              <button 
                onClick={() => setShowBioExpanded(!showBioExpanded)}
                className="mt-2 text-sm font-medium"
                style={{ color: clubColor }}
              >
                {showBioExpanded ? 'Mostrar menos' : 'Mostrar mais'}
              </button>
            )}
          </div>
        )}

        {/* Specialties */}
        {professional.specialties && professional.specialties.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5" style={{ color: clubColor }} />
              <h3 className="font-display text-lg text-card-foreground">Sou especialista em:</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {professional.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-3 py-2 text-sm rounded-full"
                  style={{ 
                    backgroundColor: clubColor + "20", 
                    color: clubColor 
                  }}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scheduling Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" style={{ color: clubColor }} />
            <h3 className="font-display text-lg text-card-foreground">Escolha um horário</h3>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: clubColor }} />
            </button>
            <span className="text-card-foreground font-medium capitalize">
              {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-muted rounded-lg transition-colors rotate-180"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: clubColor }} />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => {
              const times = getAvailableTimesForDate(day);
              const isAvailable = times.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toString()}
                  onClick={() => isAvailable && setSelectedDate(day)}
                  disabled={!isAvailable}
                  className="flex flex-col items-center p-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: isSelected ? clubColor : isAvailable ? "hsl(var(--muted))" : "hsl(var(--muted) / 0.3)",
                    color: isSelected ? "#fff" : isAvailable ? "hsl(var(--card-foreground))" : "hsl(var(--muted-foreground))",
                    opacity: isAvailable ? 1 : 0.5,
                    cursor: isAvailable ? "pointer" : "not-allowed"
                  }}
                >
                  <span className="text-xs uppercase">
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold">
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <p className="text-muted-foreground text-sm mb-3">
                Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableTimesForDate(selectedDate).map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className="py-2 px-3 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: selectedTime === time ? clubColor : "hsl(var(--muted))",
                      color: selectedTime === time ? "#fff" : "hsl(var(--card-foreground))"
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Not available message */}
          {selectedDate && getAvailableTimesForDate(selectedDate).length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Dia selecionado indisponível
            </p>
          )}
        </div>

        {/* Schedule Button - Fixed at bottom */}
        {selectedDate && selectedTime && (
          <div className="fixed bottom-20 left-4 right-4 z-40">
            <button
              onClick={handleSchedule}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-all shadow-xl"
              style={{ 
                backgroundColor: clubColor, 
                color: "#fff",
                boxShadow: `0 4px 20px ${clubColor}60`
              }}
            >
              Agendar Sessão
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfessionalProfile;