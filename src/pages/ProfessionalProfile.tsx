import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle, Award, Clock, User, Calendar, Zap, Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { getFirstAndLastName } from "@/lib/utils";

const isFemaleName = (fullName: string) => {
  const first = (fullName || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!first) return false;
  const maleExceptions = new Set(["luca","costa","silva","andrea","sasha","elias","dias","jonas","tobias","matias","isaias","aoba"]);
  if (maleExceptions.has(first)) return false;
  const femaleOverrides = new Set(["lais","laís","ines","inês","beatriz","iris","íris","mercedes","isis","ísis","raquel","isabel","cris","esther","ruth","judith","abigail","carmen","miriam","myriam","eunice","dolores","solange","heloise","eloise","eloá","eloa","agnes","damaris","noemi","noemí","rebeca","sarai","tamar","yasmin","jasmin","carol","sol","flor","mel"]);
  if (femaleOverrides.has(first)) return true;
  return /a$/.test(first);
};

const inferRoleLabel = (degree: string | null, female: boolean) => {
  const d = (degree || "").toLowerCase();
  if (d.includes("nutric")) return "Nutricionista";
  if (d.includes("fisio")) return "Fisioterapeuta";
  if (d.includes("psiqui")) return "Psiquiatra";
  if (d.includes("terapeuta ocup")) return "Terapeuta Ocupacional";
  return female ? "Psicóloga" : "Psicólogo";
};

interface Professional {
  id: string;
  user_id: string;
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

interface WeeklyAvailability {
  day_of_week: number;
  time_slots: string[];
}

interface Appointment {
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

const ProfessionalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch professional usando VIEW pública segura
        const { data: profData, error: profError } = await supabase
          .from('professionals_public')
          .select('*')
          .eq('id', id)
          .single();
        
        if (profError || !profData) {
          console.error('Erro ao buscar profissional:', profError);
          navigate(-1);
          return;
        }
        
        setProfessional(profData);

        // Fetch weekly availability
        const { data: availabilityData } = await supabase
          .from('professional_weekly_availability')
          .select('day_of_week, time_slots')
          .eq('professional_id', id)
          .order('day_of_week', { ascending: true });
        
        if (availabilityData) {
          setWeeklyAvailability(availabilityData);
        }

        // Fetch existing appointments to filter out booked slots
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('scheduled_date, scheduled_time, status')
          .eq('professional_id', id)
          .in('status', ['pending', 'confirmed', 'paid']);
        
        if (appointmentsData) {
          setBookedAppointments(appointmentsData);
        }
        
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

  // Realtime subscription for appointments updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`appointments-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `professional_id=eq.${id}`
        },
        (payload) => {
          console.log('Appointment realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment & { professional_id: string };
            if (['pending', 'confirmed', 'paid'].includes(newAppointment.status)) {
              setBookedAppointments(prev => [...prev, {
                scheduled_date: newAppointment.scheduled_date,
                scheduled_time: newAppointment.scheduled_time,
                status: newAppointment.status
              }]);
              
              // Clear selection if the selected slot was just booked
              if (selectedDate && selectedTime) {
                const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
                if (newAppointment.scheduled_date === selectedDateStr && 
                    newAppointment.scheduled_time === selectedTime) {
                  setSelectedTime(null);
                  toast({
                    title: "Horário indisponível",
                    description: "Este horário acabou de ser reservado por outro usuário.",
                    variant: "destructive",
                  });
                }
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAppointment = payload.new as Appointment & { professional_id: string };
            setBookedAppointments(prev => {
              if (['cancelled'].includes(updatedAppointment.status)) {
                return prev.filter(apt => 
                  !(apt.scheduled_date === updatedAppointment.scheduled_date && 
                    apt.scheduled_time === updatedAppointment.scheduled_time)
                );
              }
              return prev.map(apt => 
                apt.scheduled_date === updatedAppointment.scheduled_date && 
                apt.scheduled_time === updatedAppointment.scheduled_time
                  ? { ...apt, status: updatedAppointment.status }
                  : apt
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedAppointment = payload.old as Appointment;
            setBookedAppointments(prev => 
              prev.filter(apt => 
                !(apt.scheduled_date === deletedAppointment.scheduled_date && 
                  apt.scheduled_time === deletedAppointment.scheduled_time)
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, selectedDate, selectedTime, toast]);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Get available times for a specific date based on weekly availability
  const getAvailableTimesForDate = (date: Date) => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const dateStr = format(date, "yyyy-MM-dd");
    
    if (dateStr < todayStr) {
      return [];
    }
    
    const dayOfWeek = date.getDay();
    const availability = weeklyAvailability.find(a => a.day_of_week === dayOfWeek);
    const allSlots = availability?.time_slots || [];
    
    const bookedTimes = bookedAppointments
      .filter(apt => apt.scheduled_date === dateStr)
      .map(apt => apt.scheduled_time);
    
    return allSlots.filter(slot => {
      if (bookedTimes.includes(slot)) return false;
      
      if (dateStr === todayStr) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        if (slotTime < oneHourFromNow) return false;
      }
      
      return true;
    });
  };

  const getDayAbbreviation = (date: Date): string => {
    const dayOfWeek = date.getDay();
    const abbreviations = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return abbreviations[dayOfWeek];
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleSchedule = async () => {
    if (professional && currentUserId && professional.user_id === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode agendar uma sessão consigo mesmo.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime || !currentUserId || !id) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const { data: createdApt, error } = await supabase
        .from("appointments")
        .insert({
          user_id: currentUserId,
          professional_id: id,
          scheduled_date: dateStr,
          scheduled_time: selectedTime,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (createdApt?.id) {
        try {
          await Promise.race([
            supabase.functions.invoke("google-calendar-create-event", {
              body: { appointment_id: createdApt.id },
            }),
            new Promise((resolve) => setTimeout(resolve, 6000)),
          ]);
        } catch (err) {
          console.warn("gcal create-event failed", err);
        }
      }

      toast({
        title: "Agendamento enviado!",
        description: "Aguarde a confirmação do profissional.",
      });
      navigate(`/pagamento/confirmacao/${id}?date=${dateStr}&time=${encodeURIComponent(selectedTime)}`);
    } catch (err) {
      console.error("Error creating appointment:", err);
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const clubColor = club?.primary_color || "#10b981";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div 
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" 
          style={{ borderColor: clubColor, borderTopColor: 'transparent' }}
        />
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header with Gradient */}
      <div 
        className="relative pt-4 pb-20"
        style={{ 
          background: `linear-gradient(135deg, ${clubColor} 0%, ${clubColor}dd 50%, ${clubColor}bb 100%)`
        }}
      >
        {/* Navigation */}
        <div className="px-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Hero */}
        <div className="px-4 flex flex-col items-center text-center">
          {/* Avatar with glow effect */}
          <div className="relative mb-4">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-60"
              style={{ backgroundColor: clubColor }}
            />
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Profissional'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <User className="w-12 h-12" style={{ color: clubColor }} />
                </div>
              )}
            </div>
            {professional.is_verified && (
              <div 
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <CheckCircle className="w-5 h-5" style={{ color: clubColor }} />
              </div>
            )}
          </div>

          {/* Name and Title */}
          <h1 className="text-2xl font-bold text-white mb-1">
            {profile.full_name}
          </h1>
          <p className="text-white/80 text-sm mb-1">
            {professional.degree || 'Psicólogo(a)'}
          </p>
          <p className="text-white/60 text-xs mb-4">
            CRP: {professional.crp}
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-white/90">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">{professional.experience_years || 0} anos</span>
            </div>
            {professional.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{professional.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Overlapping Cards */}
      <main className="px-4 -mt-12 pb-28 space-y-4">
        {/* Price Card */}
        {professional.hourly_rate && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Valor da Sessão</p>
                <p className="text-3xl font-bold" style={{ color: clubColor }}>
                  R$ {professional.hourly_rate.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '15' }}
              >
                <Sparkles className="w-7 h-7" style={{ color: clubColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Scheduling Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Section Header */}
          <div 
            className="px-5 py-4 flex items-center gap-3"
            style={{ backgroundColor: clubColor + '08' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: clubColor + '15' }}
            >
              <Calendar className="w-5 h-5" style={{ color: clubColor }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Agendar Sessão</h2>
              <p className="text-sm text-gray-500">Escolha o melhor horário</p>
            </div>
          </div>

          <div className="p-5">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handlePreviousWeek}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-gray-900 font-semibold capitalize">
                {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button
                onClick={handleNextWeek}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Week Days Grid */}
            <div className="grid grid-cols-7 gap-2 mb-5">
              {weekDays.map((day) => {
                const times = getAvailableTimesForDate(day);
                const isAvailable = times.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toString()}
                    onClick={() => isAvailable && setSelectedDate(day)}
                    disabled={!isAvailable}
                    className={`
                      relative flex flex-col items-center py-3 rounded-xl transition-all
                      ${isSelected 
                        ? 'text-white shadow-lg transform scale-105' 
                        : isAvailable 
                          ? 'bg-gray-50 hover:bg-gray-100 text-gray-700' 
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? clubColor : undefined,
                    }}
                  >
                    <span className="text-[10px] uppercase font-medium tracking-wide mb-1">
                      {getDayAbbreviation(day)}
                    </span>
                    <span className="text-lg font-bold">
                      {format(day, "d")}
                    </span>
                    {isToday && !isSelected && (
                      <div 
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: clubColor }}
                      />
                    )}
                    {isAvailable && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-gray-600 text-sm mb-3 font-medium">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {getAvailableTimesForDate(selectedDate).map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`
                        py-3 px-2 rounded-xl text-sm font-semibold transition-all
                        ${selectedTime === time 
                          ? 'text-white shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }
                      `}
                      style={{
                        backgroundColor: selectedTime === time ? clubColor : undefined,
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                {/* Schedule Button */}
                {selectedTime && (
                  <button
                    onClick={handleSchedule}
                    className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide hover:opacity-90 transition-all shadow-lg"
                    style={{ 
                      backgroundColor: clubColor,
                      boxShadow: `0 10px 30px ${clubColor}40`
                    }}
                  >
                    Agendar Sessão
                  </button>
                )}
              </div>
            )}

            {/* No slots message */}
            {selectedDate && getAvailableTimesForDate(selectedDate).length === 0 && (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Sem horários disponíveis neste dia</p>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {professional.bio && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '15' }}
              >
                <User className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <h2 className="font-bold text-gray-900">Sobre Mim</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {professional.bio}
            </p>
          </div>
        )}

        {/* Specialties Section */}
        {professional.specialties && professional.specialties.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '15' }}
              >
                <Award className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <h2 className="font-bold text-gray-900">Especialidades</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {professional.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-4 py-2 text-sm font-medium rounded-full"
                  style={{ 
                    backgroundColor: clubColor + '12', 
                    color: clubColor 
                  }}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
};

export default ProfessionalProfile;
