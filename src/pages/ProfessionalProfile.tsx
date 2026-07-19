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

  const female = isFemaleName(profile.full_name || "");
  const roleLabel = inferRoleLabel(professional.degree, female);
  const displayName = getFirstAndLastName(profile.full_name || "Profissional");
  const softTint = `color-mix(in oklab, ${clubColor}, white 88%)`;
  const canSchedule = !!selectedDate && !!selectedTime;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header title="Perfil do Profissional" />

      <main className="flex-1 pt-[calc(env(safe-area-inset-top)+56px+12px)] px-4 pb-36 space-y-4">
        {/* Main info card */}
        <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <div className="flex gap-4">
            <div className="relative flex-shrink-0 w-[96px] h-[120px] rounded-2xl overflow-hidden bg-slate-100">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="absolute inset-0 w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
              )}
              {professional.is_verified && (
                <div className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <CheckCircle className="w-4 h-4" style={{ color: clubColor, fill: "white" }} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-[20px] text-slate-900 leading-tight capitalize truncate">
                  {displayName.toLowerCase()}
                </h2>
                {professional.is_verified && (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: clubColor, fill: "white" }} strokeWidth={2.5} />
                )}
              </div>
              <div className="mt-1.5">
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: clubColor }}
                >
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-slate-500">CRP: {professional.crp}</p>

              <div className="mt-3 flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4" style={{ color: clubColor, fill: clubColor }} />
                  <div className="leading-tight">
                    <div className="text-[12px] font-bold text-slate-800">
                      {professional.experience_years || 0} {professional.experience_years === 1 ? "ano" : "anos"}
                    </div>
                    <div className="text-[10px] text-slate-500 whitespace-nowrap">de experiência</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shirt className="w-4 h-4 flex-shrink-0" style={{ color: clubColor }} strokeWidth={2} />
                  <div className="leading-tight min-w-0">
                    <div className="text-[12px] font-bold text-slate-800">{female ? "Torcedora" : "Torcedor"}</div>
                    <div className="text-[10px] text-slate-500 truncate">{club?.name || professional.location || ""}</div>
                  </div>
                </div>
                {professional.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" style={{ color: clubColor }} />
                    <span className="text-[12px] font-bold text-slate-800">{professional.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Valor da sessão */}
        {professional.hourly_rate && (
          <section
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ backgroundColor: softTint }}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5" style={{ color: clubColor }} strokeWidth={2.5} />
              <span className="text-[15px] font-semibold text-slate-800">Valor da sessão</span>
            </div>
            <span className="text-[20px] font-bold" style={{ color: clubColor }}>
              R$ {professional.hourly_rate.toFixed(2).replace(".", ",")}
            </span>
          </section>
        )}

        {/* Sobre */}
        {professional.bio && (
          <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5" style={{ color: clubColor }} strokeWidth={2.5} />
              <h3 className="font-bold text-slate-900 normal-case">Sobre</h3>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed">{professional.bio}</p>
          </section>
        )}

        {/* Especialidades */}
        {professional.specialties && professional.specialties.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5" style={{ color: clubColor }} strokeWidth={2.5} />
              <h3 className="font-bold text-slate-900 normal-case">Especialidades</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {professional.specialties.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                  style={{ backgroundColor: softTint, color: clubColor }}
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Agende um horário */}
        <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5" style={{ color: clubColor }} strokeWidth={2.5} />
            <h3 className="font-bold text-slate-900 normal-case">Agende um horário</h3>
          </div>

          <div className="flex items-center justify-between mb-3">
            <button onClick={handlePreviousWeek} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-slate-800 font-semibold capitalize text-[14px]">
              {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={handleNextWeek} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {weekDays.map((day) => {
              const times = getAvailableTimesForDate(day);
              const isAvailable = times.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toString()}
                  onClick={() => isAvailable && setSelectedDate(day)}
                  disabled={!isAvailable}
                  className={`relative flex flex-col items-center py-2.5 rounded-xl transition-all border ${
                    isSelected
                      ? "text-white shadow-md border-transparent"
                      : isAvailable
                      ? "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                      : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                  style={{ backgroundColor: isSelected ? clubColor : undefined, borderColor: isSelected ? clubColor : undefined }}
                >
                  <span className="text-[9px] uppercase font-semibold tracking-wide">{getDayAbbreviation(day)}</span>
                  <span className="text-[16px] font-bold">{format(day, "d")}</span>
                  {isAvailable && !isSelected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clubColor }} />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-slate-600 text-[12px] mb-2 font-medium capitalize">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableTimesForDate(selectedDate).map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                      selectedTime === time ? "text-white border-transparent shadow-sm" : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                    }`}
                    style={{ backgroundColor: selectedTime === time ? clubColor : undefined }}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {getAvailableTimesForDate(selectedDate).length === 0 && (
                <div className="text-center py-4">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-slate-500 text-[13px]">Sem horários disponíveis</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Fixed footer CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-30">
        <button
          onClick={handleSchedule}
          disabled={!canSchedule}
          className="w-full py-3.5 rounded-full font-bold text-white text-[15px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105"
          style={{ backgroundColor: clubColor, boxShadow: canSchedule ? `0 8px 24px ${clubColor}55` : undefined }}
        >
          Agendar sessão
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default ProfessionalProfile;
