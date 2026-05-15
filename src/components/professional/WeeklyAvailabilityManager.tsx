import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Pencil, X, Loader2, CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GoogleCalendarConnectCard from "./GoogleCalendarConnectCard";

interface WeeklyAvailability {
  id: string;
  professional_id: string;
  day_of_week: number;
  time_slots: string[];
}

interface GcalBlock {
  start_time: string;
  end_time: string;
  summary: string | null;
  is_all_day: boolean;
}

interface WeeklyAvailabilityManagerProps {
  professionalId: string;
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
  onUpdate 
}: WeeklyAvailabilityManagerProps) => {
  const [availabilities, setAvailabilities] = useState<WeeklyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [gcalBlocks, setGcalBlocks] = useState<GcalBlock[]>([]);
  const [syncingBlocks, setSyncingBlocks] = useState(false);
  // (lockdown removido — slots individuais são filtrados por gcalBlocks)
  
  // Edit mode state
  const [editingAvailability, setEditingAvailability] = useState<WeeklyAvailability | null>(null);
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchAvailabilities();
    fetchGcalBlocks();
  }, [professionalId]);

  // Realtime: refresh GCal blocks whenever they change in the DB
  useEffect(() => {
    if (!professionalId) return;
    const channel = supabase
      .channel(`gcal-blocks-panel-${professionalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'google_calendar_blocks',
          filter: `professional_id=eq.${professionalId}`,
        },
        () => { reloadGcalBlocks(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [professionalId]);

  const fetchGcalBlocks = async () => {
    // Wait for the sync so the rows we read below are up-to-date
    setSyncingBlocks(true);
    try {
      await supabase.functions.invoke('google-calendar-sync-now', {
        body: { professional_id: professionalId, force: true },
      });
    } catch (_) { /* best-effort */ }
    finally { setSyncingBlocks(false); }
    await reloadGcalBlocks();
  };

  const reloadGcalBlocks = async () => {
    const { data } = await supabase
      .from('google_calendar_blocks')
      .select('start_time, end_time, summary, is_all_day')
      .eq('professional_id', professionalId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(500);
    if (data) setGcalBlocks(data);
  };

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

  // Push current weekly availability as recurring "Reservado — Fanaticamente"
  // events to the professional's dedicated Google Calendar. Best-effort: if the
  // calendar isn't connected or the call fails, the in-app slots still work.
  const syncReservationsToGoogle = async () => {
    try {
      await supabase.functions.invoke('google-calendar-reserve-availability', {
        body: { professional_id: professionalId },
      });
    } catch (e) {
      console.warn('reserve-availability failed', e);
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
      syncReservationsToGoogle();
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
      setEditingAvailability(null);
      fetchAvailabilities();
      onUpdate();
      syncReservationsToGoogle();
    } catch (error) {
      console.error("Error deleting availability:", error);
      toast.error("Erro ao remover disponibilidade");
    }
  };

  const handleUpdateAvailability = async () => {
    if (!editingAvailability || editTimes.length === 0) {
      toast.error("Selecione pelo menos um horário");
      return;
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("professional_weekly_availability")
        .update({ time_slots: editTimes.sort() })
        .eq("id", editingAvailability.id);

      if (error) throw error;

      toast.success("Horários atualizados!");
      setEditingAvailability(null);
      fetchAvailabilities();
      onUpdate();
      syncReservationsToGoogle();
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Erro ao atualizar horários");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const toggleEditTime = (time: string) => {
    if (editTimes.includes(time)) {
      setEditTimes(editTimes.filter(t => t !== time));
    } else {
      setEditTimes([...editTimes, time]);
    }
  };

  const openEditMode = (availability: WeeklyAvailability) => {
    setEditingAvailability(availability);
    setEditTimes([...availability.time_slots]);
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || "";
  };

  const getDayAbbr = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.abbr || "";
  };

  // Returns true if the next occurrence of (dayOfWeek, time) overlaps any
  // Google Calendar busy block (50min session window).
  const isSlotBlockedByGcal = (dayOfWeek: number, time: string) => {
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    const diff = (dayOfWeek - now.getDay() + 7) % 7;
    target.setDate(now.getDate() + diff);
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7);
    const slotEnd = target.getTime() + 50 * 60 * 1000;
    return gcalBlocks.some((b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return bs < slotEnd && be > target.getTime();
    });
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
      {/* Google Calendar integration */}
      <GoogleCalendarConnectCard professionalId={professionalId} />

      {/* GCal busy blocks (auto-hidden from booking) */}
      {gcalBlocks.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarOff className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-card-foreground">
              Bloqueado pelo Google Calendar
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Estes horários são ocultados automaticamente para os torcedores na hora de agendar.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {gcalBlocks.map((b, i) => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              const dateLabel = start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
              const timeLabel = b.is_all_day
                ? 'Dia todo'
                : `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
              return (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                  <span className="text-card-foreground">{b.summary || 'Compromisso'}</span>
                  <span className="text-muted-foreground text-xs">{dateLabel} · {timeLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Edit Availability Modal */}
      {editingAvailability && (
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-therapy/20 text-therapy font-bold flex items-center justify-center text-sm">
                {getDayAbbr(editingAvailability.day_of_week)}
              </span>
              <h3 className="font-medium text-card-foreground">
                Editar {getDayLabel(editingAvailability.day_of_week)}
              </h3>
            </div>
            <button
              onClick={() => setEditingAvailability(null)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Time Selection for Edit */}
          <div className="mb-4">
            <label className="block text-muted-foreground text-sm mb-2">
              Selecione os horários
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleEditTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    editTimes.includes(time)
                      ? "bg-therapy text-therapy-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpdateAvailability}
              disabled={savingEdit || editTimes.length === 0}
              className="flex-1 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Alterações
            </button>
            <button
              onClick={() => handleDeleteAvailability(editingAvailability.id)}
              className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
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
                  onClick={() => openEditMode(availability)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors group"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-therapy" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availability.time_slots.map((time) => {
                  const blocked = isSlotBlockedByGcal(availability.day_of_week, time);
                  return (
                    <span
                      key={time}
                      title={blocked ? 'Bloqueado pelo Google Calendar nesta semana' : undefined}
                      className={
                        blocked
                          ? "px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full line-through opacity-70"
                          : "px-3 py-1 bg-therapy/20 text-therapy text-sm rounded-full"
                      }
                    >
                      {time}
                    </span>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklyAvailabilityManager;
