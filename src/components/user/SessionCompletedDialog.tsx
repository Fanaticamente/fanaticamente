import { useState, useEffect } from "react";
import { X, Star, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface WeeklyAvailability {
  day_of_week: number;
  time_slots: string[];
}

interface Appointment {
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

interface SessionCompletedDialogProps {
  appointment: {
    id: string;
    professional_id: string;
    scheduled_date: string;
    scheduled_time: string;
    professional?: {
      crp: string;
      degree: string | null;
      hourly_rate: number | null;
    } | null;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  onClose: () => void;
  onReschedule?: () => void;
}

const SessionCompletedDialog = ({ appointment, onClose, onReschedule }: SessionCompletedDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch availability when showing reschedule
  useEffect(() => {
    if (showReschedule) {
      fetchAvailability();
    }
  }, [showReschedule, appointment.professional_id]);

  const fetchAvailability = async () => {
    try {
      // Fetch weekly availability
      const { data: availabilityData } = await supabase
        .from('professional_weekly_availability')
        .select('day_of_week, time_slots')
        .eq('professional_id', appointment.professional_id)
        .order('day_of_week', { ascending: true });
      
      if (availabilityData) {
        setWeeklyAvailability(availabilityData);
      }

      // Fetch existing appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('scheduled_date, scheduled_time, status')
        .eq('professional_id', appointment.professional_id)
        .in('status', ['pending', 'confirmed', 'paid', 'link_sent', 'in_progress']);
      
      if (appointmentsData) {
        setBookedAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return;
    
    // For now, just show success - in future could save to database
    setHasRated(true);
    toast({
      title: "Obrigado pela avaliação!",
      description: `Você avaliou a sessão com ${rating} estrela${rating > 1 ? 's' : ''}.`,
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const getAvailableTimesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const availability = weeklyAvailability.find(a => a.day_of_week === dayOfWeek);
    const allSlots = availability?.time_slots || [];
    
    const dateStr = format(date, "yyyy-MM-dd");
    const bookedTimes = bookedAppointments
      .filter(apt => apt.scheduled_date === dateStr)
      .map(apt => apt.scheduled_time);
    
    return allSlots.filter(slot => !bookedTimes.includes(slot));
  };

  const getDayAbbreviation = (date: Date): string => {
    const dayOfWeek = date.getDay();
    const abbreviations = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return abbreviations[dayOfWeek];
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

  const handleScheduleNew = () => {
    if (selectedDate && selectedTime) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      onClose();
      navigate(`/pagamento/${appointment.professional_id}?date=${dateStr}&time=${encodeURIComponent(selectedTime)}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-lg text-card-foreground">
            {showReschedule ? "Agendar Nova Sessão" : "Sessão Concluída"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {!showReschedule ? (
            <>
              {/* Completed Message */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-2">
                  Consulta Concluída!
                </h4>
                <p className="text-muted-foreground text-sm">
                  Sua sessão com {appointment.profile?.full_name || "o profissional"} foi encerrada.
                </p>
              </div>

              {/* Rating Section */}
              {!hasRated ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-center">
                    Avalie sua experiência
                  </h4>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <button
                      onClick={handleRatingSubmit}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      Enviar Avaliação
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                  <p className="text-green-600 font-medium">
                    Obrigado pela sua avaliação!
                  </p>
                </div>
              )}

              {/* Reschedule Option */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowReschedule(true)}
                  className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:bg-therapy/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Nova Sessão
                </button>
                <button
                  onClick={onClose}
                  className="w-full mt-3 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => {
                  setShowReschedule(false);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              {/* Professional Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-therapy/20 flex items-center justify-center overflow-hidden">
                  {appointment.profile?.avatar_url ? (
                    <img 
                      src={appointment.profile.avatar_url} 
                      alt={appointment.profile.full_name || "Profissional"} 
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <span className="text-therapy text-lg font-bold">
                      {(appointment.profile?.full_name || "P")[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {appointment.profile?.full_name || "Profissional"}
                  </p>
                  {appointment.professional && (
                    <p className="text-muted-foreground text-sm">
                      CRP {appointment.professional.crp}
                    </p>
                  )}
                </div>
              </div>

              {/* Week Navigation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <span className="text-card-foreground font-medium capitalize">
                    {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
                  </span>
                  <button
                    onClick={handleNextWeek}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const times = getAvailableTimesForDate(day);
                    const isAvailable = times.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => isAvailable && setSelectedDate(day)}
                        disabled={!isAvailable}
                        className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : isAvailable 
                            ? "bg-muted hover:bg-muted/80 text-card-foreground" 
                            : "bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-xs uppercase">
                          {getDayAbbreviation(day)}
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
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                      Horários para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {getAvailableTimesForDate(selectedDate).map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedTime === time
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-card-foreground hover:bg-muted/80"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule Button */}
                {selectedTime && (
                  <button
                    onClick={handleScheduleNew}
                    disabled={loading}
                    className="w-full py-4 bg-therapy text-therapy-foreground rounded-xl font-bold uppercase tracking-wide hover:bg-therapy/90 transition-all disabled:opacity-50"
                  >
                    {loading ? "Agendando..." : "Agendar Nova Sessão"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCompletedDialog;
