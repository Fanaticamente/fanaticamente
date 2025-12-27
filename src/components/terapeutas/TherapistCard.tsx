import { useState } from "react";
import { CheckCircle, MapPin, Star, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AvailableSlot {
  date: Date;
  times: string[];
}

interface Therapist {
  id: number;
  name: string;
  crp: string;
  degree: string;
  experience: number;
  location: string;
  specialties: string[];
  verified: boolean;
  availableSlots: AvailableSlot[];
}

interface TherapistCardProps {
  therapist: Therapist;
  clubColor: string;
}

const TherapistCard = ({ therapist, clubColor }: TherapistCardProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const getAvailableTimesForDate = (date: Date) => {
    const slot = therapist.availableSlots.find((s) => isSameDay(s.date, date));
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      alert(
        `Consulta agendada com ${therapist.name} para ${format(
          selectedDate,
          "dd/MM/yyyy",
          { locale: ptBR }
        )} às ${selectedTime}`
      );
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-4">
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: clubColor + "20" }}
        >
          🧑‍⚕️
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl text-card-foreground">
              {therapist.name}
            </h3>
            {therapist.verified && (
              <CheckCircle className="w-5 h-5 text-secondary" />
            )}
          </div>
          <p className="text-muted-foreground text-sm">{therapist.crp}</p>
          <p className="text-muted-foreground text-sm">{therapist.degree}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-primary" />
          {therapist.experience} anos
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {therapist.location}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {therapist.specialties.map((specialty) => (
          <span
            key={specialty}
            className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
          >
            {specialty}
          </span>
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02]"
            style={{ backgroundColor: clubColor, color: "#fff" }}
          >
            Agendar Consulta
          </button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-card-foreground">
              Agendar com {therapist.name}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousWeek}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
              <span className="text-card-foreground font-medium">
                {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
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
                    onClick={() => isAvailable && handleDateSelect(day)}
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
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-card-foreground font-medium">
                    Horários disponíveis
                  </span>
                </div>
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

            {/* Confirm Button */}
            {selectedDate && selectedTime && (
              <button
                onClick={handleSchedule}
                className="w-full mt-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-all"
              >
                Confirmar Agendamento
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistCard;
