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

import therapist1 from "@/assets/therapist-1.jpg";
import therapist2 from "@/assets/therapist-2.jpg";
import therapist3 from "@/assets/therapist-3.jpg";
import therapist4 from "@/assets/therapist-4.jpg";

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
  imageUrl?: string;
}

interface TherapistCardProps {
  therapist: Therapist;
  clubColor: string;
  clubSecondaryColor?: string;
}

const therapistImages = [therapist1, therapist2, therapist3, therapist4];

const TherapistCard = ({ therapist, clubColor, clubSecondaryColor }: TherapistCardProps) => {
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

  const imageUrl = therapist.imageUrl || therapistImages[(therapist.id - 1) % 4];

  return (
    <div 
      className="bg-card border-2 rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.01]"
      style={{ borderColor: clubColor + "40" }}
    >
      {/* Header with club color accent */}
      <div 
        className="h-2"
        style={{ backgroundColor: clubColor }}
      />
      
      <div className="p-6">
        <div className="flex gap-4 mb-4">
          {/* Photo - Vertical Rectangle */}
          <div 
            className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: clubColor + "60" }}
          >
            <img 
              src={imageUrl} 
              alt={therapist.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-xl text-card-foreground">
                {therapist.name}
              </h3>
              {therapist.verified && (
                <CheckCircle 
                  className="w-5 h-5" 
                  style={{ color: clubColor }}
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm">{therapist.crp}</p>
            <p className="text-muted-foreground text-sm mb-3">{therapist.degree}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" style={{ color: clubColor }} />
                {therapist.experience} anos
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {therapist.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {therapist.specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: clubColor + "20", 
                color: clubColor 
              }}
            >
              {specialty}
            </span>
          ))}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button
              className="w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ 
                backgroundColor: clubColor, 
                color: "#fff",
                boxShadow: `0 4px 14px ${clubColor}40`
              }}
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
                  <ChevronLeft className="w-5 h-5" style={{ color: clubColor }} />
                </button>
                <span className="text-card-foreground font-medium">
                  {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
                </span>
                <button
                  onClick={handleNextWeek}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: clubColor }} />
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
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" style={{ color: clubColor }} />
                    <span className="text-card-foreground font-medium">
                      Horários disponíveis
                    </span>
                  </div>
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

              {/* Confirm Button */}
              {selectedDate && selectedTime && (
                <button
                  onClick={handleSchedule}
                  className="w-full mt-6 py-3 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-all"
                  style={{ 
                    backgroundColor: clubSecondaryColor || clubColor, 
                    color: "#fff" 
                  }}
                >
                  Confirmar Agendamento
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TherapistCard;
