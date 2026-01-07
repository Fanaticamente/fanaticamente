import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeeklyAvailability {
  id: string;
  professional_id: string;
  day_of_week: number;
  time_slots: string[];
}

interface WeeklyAvailabilityManagerProps {
  professionalId: string;
  googleCalendarUrl: string | null;
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", abbr: "DOM" },
  { value: 1, label: "Segunda-feira", abbr: "SEG" },
  { value: 2, label: "Terça-feira", abbr: "TER" },
  { value: 3, label: "Quarta-feira", abbr: "QUA" },
  { value: 4, label: "Quinta-feira", abbr: "QUI" },
  { value: 5, label: "Sexta-feira", abbr: "SEX" },
  { value: 6, label: "Sábado", abbr: "SÁB" },
];

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00"
];

const WeeklyAvailabilityManager = ({ 
  professionalId, 
  googleCalendarUrl,
  onUpdate 
}: WeeklyAvailabilityManagerProps) => {
  const [availabilities, setAvailabilities] = useState<WeeklyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [calendarUrl, setCalendarUrl] = useState(googleCalendarUrl || "");
  const [savingCalendar, setSavingCalendar] = useState(false);

  useEffect(() => {
    fetchAvailabilities();
  }, [professionalId]);

  const fetchAvailabilities = async () => {
    try {
      const { data, error } = await supabase
        .from("professional_weekly_availability")
        .select("*")
        .eq("professional_id", professionalId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      toast.error("Erro ao carregar disponibilidades");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    if (selectedDay === null || selectedTimes.length === 0) {
      toast.error("Selecione um dia e pelo menos um horário");
      return;
    }

    // Check if day already exists
    const existingDay = availabilities.find(a => a.day_of_week === selectedDay);
    if (existingDay) {
      toast.error("Este dia já está cadastrado. Edite ou remova primeiro.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("professional_weekly_availability")
        .insert({
          professional_id: professionalId,
          day_of_week: selectedDay,
          time_slots: selectedTimes.sort()
        });

      if (error) throw error;

      toast.success("Disponibilidade adicionada!");
      setShowAddSlot(false);
      setSelectedDay(null);
      setSelectedTimes([]);
      fetchAvailabilities();
      onUpdate();
    } catch (error) {
      console.error("Error adding availability:", error);
      toast.error("Erro ao salvar disponibilidade");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from("professional_weekly_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Disponibilidade removida!");
      fetchAvailabilities();
      onUpdate();
    } catch (error) {
      console.error("Error deleting availability:", error);
      toast.error("Erro ao remover disponibilidade");
    }
  };

  const handleSaveCalendarUrl = async () => {
    setSavingCalendar(true);
    try {
      const { error } = await supabase
        .from("professionals")
        .update({ google_calendar_url: calendarUrl || null })
        .eq("id", professionalId);

      if (error) throw error;

      toast.success("Link da agenda salvo!");
      onUpdate();
    } catch (error) {
      console.error("Error saving calendar URL:", error);
      toast.error("Erro ao salvar link da agenda");
    } finally {
      setSavingCalendar(false);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || "";
  };

  const getDayAbbr = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.abbr || "";
  };

  // Get days that are not yet configured
  const availableDays = DAYS_OF_WEEK.filter(
    day => !availabilities.some(a => a.day_of_week === day.value)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-therapy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-card-foreground">
          Seus Horários
        </h2>
        {availableDays.length > 0 && (
          <button
            onClick={() => setShowAddSlot(true)}
            className="flex items-center gap-2 px-4 py-2 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </button>
        )}
      </div>

      {/* Add New Availability Form */}
      {showAddSlot && (
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
          <h3 className="font-medium text-card-foreground mb-4">Nova Disponibilidade</h3>
          
          {/* Day Selection */}
          <div className="mb-4">
            <label className="block text-muted-foreground text-sm mb-2">Dia da Semana</label>
            <div className="flex flex-wrap gap-2">
              {availableDays.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === day.value
                      ? "bg-therapy text-therapy-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {day.abbr}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDay !== null && (
            <div className="mb-4">
              <label className="block text-muted-foreground text-sm mb-2">
                Horários para {getDayLabel(selectedDay)}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimes.includes(time)
                        ? "bg-therapy text-therapy-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAddAvailability}
              disabled={saving || selectedDay === null || selectedTimes.length === 0}
              className="flex-1 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
            <button
              onClick={() => {
                setShowAddSlot(false);
                setSelectedDay(null);
                setSelectedTimes([]);
              }}
              className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Current Availabilities */}
      <div className="space-y-4">
        {availabilities.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma disponibilidade cadastrada
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Adicione os dias e horários que você atende
            </p>
          </div>
        ) : (
          availabilities.map((availability) => (
            <div
              key={availability.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-therapy/20 text-therapy font-bold flex items-center justify-center text-sm">
                    {getDayAbbr(availability.day_of_week)}
                  </span>
                  <h3 className="font-medium text-card-foreground">
                    {getDayLabel(availability.day_of_week)}
                  </h3>
                </div>
                <button 
                  onClick={() => handleDeleteAvailability(availability.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors group"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availability.time_slots.map((time) => (
                  <span
                    key={time}
                    className="px-3 py-1 bg-therapy/20 text-therapy text-sm rounded-full"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-therapy" />
          <h3 className="font-medium text-card-foreground">Integração Google Agenda</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Conecte sua Google Agenda para sincronizar automaticamente seus horários disponíveis.
          Use o link de compartilhamento público da sua agenda.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={calendarUrl}
            onChange={(e) => setCalendarUrl(e.target.value)}
            placeholder="Cole o link público da sua Google Agenda"
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSaveCalendarUrl}
            disabled={savingCalendar}
            className="px-4 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {savingCalendar ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </button>
        </div>
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-therapy hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Ver agenda conectada
          </a>
        )}
      </div>
    </div>
  );
};

export default WeeklyAvailabilityManager;
