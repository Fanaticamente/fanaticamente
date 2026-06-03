import { useState, useEffect } from "react";
import { Calendar, Clock, Loader2, X, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isBefore, parseISO, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WeeklyAvailability {
  day_of_week: number;
  time_slots: string[];
}

interface BookedAppointment {
  scheduled_date: string;
  scheduled_time: string;
}

interface RescheduleDialogProps {
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onRescheduled: () => void;
}

const RescheduleDialog = ({
  appointmentId,
  professionalId,
  professionalName,
  currentDate,
  currentTime,
  onClose,
  onRescheduled
}: RescheduleDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const DAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  useEffect(() => {
    fetchAvailability();
  }, [professionalId]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      // Fetch weekly availability
      const { data: availabilityData } = await supabase
        .from('professional_weekly_availability')
        .select('day_of_week, time_slots')
        .eq('professional_id', professionalId)
        .order('day_of_week', { ascending: true });

      if (availabilityData) {
        setWeeklyAvailability(availabilityData);
      }

      // Fetch booked appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('scheduled_date, scheduled_time')
        .eq('professional_id', professionalId)
        .in('status', ['pending', 'confirmed', 'paid', 'link_sent', 'in_progress'])
        .neq('id', appointmentId); // Exclude current appointment

      if (appointmentsData) {
        setBookedAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Erro ao carregar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  // Get days with availability
  const daysWithAvailability = availableDates.filter(date => {
    const dayOfWeek = date.getDay();
    const availability = weeklyAvailability.find(a => a.day_of_week === dayOfWeek);
    return availability && availability.time_slots.length > 0;
  });

  // Get available times for selected date
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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedTime,
          status: 'pending', // Reset to pending for new confirmation
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Consulta reagendada com sucesso!');
      onRescheduled();
      onClose();
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Erro ao reagendar consulta');
    } finally {
      setSubmitting(false);
    }
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-card-foreground">
              Reagendar Consulta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Current appointment info */}
              <div className="mb-4 p-3 bg-muted/50 rounded-xl">
                <p className="text-muted-foreground text-sm mb-1">Consulta atual com</p>
                <p className="font-medium text-card-foreground">{professionalName}</p>
                <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(currentDate), "dd/MM/yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentTime}
                  </span>
                </div>
              </div>

              {/* Select new date */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Selecione uma nova data
                </h3>
                {daysWithAvailability.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhum horário disponível nos próximos 14 dias
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {daysWithAvailability.slice(0, 8).map((date) => {
                      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null);
                          }}
                          className={`p-2 rounded-xl text-center transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-card-foreground"
                          }`}
                        >
                          <div className="text-xs opacity-70">{DAY_LABELS[date.getDay()]}</div>
                          <div className="text-lg font-bold">{format(date, 'dd')}</div>
                          <div className="text-xs opacity-70">{format(date, 'MMM', { locale: ptBR })}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select time */}
              {selectedDate && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Selecione um horário
                  </h3>
                  {availableTimes.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhum horário disponível nesta data
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-xl text-center transition-colors text-sm font-medium ${
                            selectedTime === time
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-card-foreground"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || submitting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Confirmar Reagendamento
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleDialog;
