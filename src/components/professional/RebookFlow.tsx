import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { format, parseISO, addDays, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RebookFlowProps {
  professionalId: string;
  patientUserId: string;
  baseDate: string;
  baseTime: string;
  onDone: () => void | Promise<void>;
}

type Phase = "ask" | "choose" | "calendar";

/**
 * Post-session rebooking flow: asks the professional whether to schedule a new
 * appointment with the same patient (repeat next week or pick another slot).
 */
const RebookFlow = ({ professionalId, patientUserId, baseDate, baseTime, onDone }: RebookFlowProps) => {
  const [phase, setPhase] = useState<Phase>("ask");
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<{ day_of_week: number; time_slots: string[] }[]>([]);
  const [booked, setBooked] = useState<{ scheduled_date: string; scheduled_time: string }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "calendar") return;
    (async () => {
      const [{ data: avail }, { data: apts }] = await Promise.all([
        supabase
          .from("professional_weekly_availability")
          .select("day_of_week, time_slots")
          .eq("professional_id", professionalId),
        supabase
          .from("appointments")
          .select("scheduled_date, scheduled_time")
          .eq("professional_id", professionalId)
          .gte("scheduled_date", new Date().toISOString().slice(0, 10))
          .not("status", "in", '("cancelled","rejected")'),
      ]);
      setAvailability((avail as { day_of_week: number; time_slots: string[] }[] | null) || []);
      setBooked(apts || []);
    })();
  }, [phase, professionalId]);

  const days = useMemo(() => {
    const base = addDays(new Date(), 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [weekOffset]);

  const slotsForDate = (date: Date) => {
    const entry = availability.find((a) => a.day_of_week === date.getDay());
    if (!entry) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return (entry.time_slots || []).filter(
      (t) => !booked.some((b) => b.scheduled_date === dateStr && b.scheduled_time.slice(0, 5) === t.slice(0, 5))
    );
  };

  const createAppointment = async (date: string, time: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: patientUserId,
        professional_id: professionalId,
        scheduled_date: date,
        scheduled_time: time,
        status: "confirmed",
      });
      if (error) throw error;
      toast.success(
        `Nova consulta marcada para ${format(parseISO(date), "dd/MM/yyyy")} às ${time.slice(0, 5)}`
      );
      await onDone();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao marcar a nova consulta");
    } finally {
      setBusy(false);
    }
  };

  const handleRepeat = () => {
    const next = addWeeks(parseISO(baseDate), 1);
    createAppointment(format(next, "yyyy-MM-dd"), baseTime);
  };

  return (
    <div className="fixed inset-0 z-[220] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[calc(100%-1rem)] max-w-lg max-h-[85vh] overflow-auto">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Nova consulta</h3>
          <p className="text-xs text-slate-500 mt-1">Finalize este passo para concluir a sessão.</p>
        </div>

        {phase === "ask" && (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-lg font-semibold text-slate-800">
              Marcar uma nova consulta com este paciente?
            </p>
            <div className="flex gap-3">
              <button onClick={onDone} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium">
                Não
              </button>
              <button
                onClick={() => setPhase("choose")}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium"
              >
                Sim
              </button>
            </div>
          </div>
        )}

        {phase === "choose" && (
          <div className="p-6 space-y-3">
            <p className="text-slate-800 font-semibold text-center">Como deseja marcar?</p>
            <button
              onClick={handleRepeat}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-medium disabled:opacity-50"
            >
              Repetir dia e horário (próxima semana)
            </button>
            <button
              onClick={() => setPhase("calendar")}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
            >
              Outro
            </button>
          </div>
        )}

        {phase === "calendar" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className="p-2 rounded-lg bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {format(days[0], "dd MMM", { locale: ptBR })} – {format(days[6], "dd MMM", { locale: ptBR })}
              </span>
              <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 rounded-lg bg-slate-100">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const dateStr = format(d, "yyyy-MM-dd");
                const has = slotsForDate(d).length > 0;
                const active = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    disabled={!has}
                    onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                    className={`py-2 rounded-lg text-xs font-medium ${
                      active ? "bg-slate-800 text-white" : has ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-300"
                    }`}
                  >
                    <span className="block">{format(d, "EEEEE", { locale: ptBR })}</span>
                    <span className="block text-sm">{format(d, "dd")}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="flex flex-wrap gap-2">
                {slotsForDate(parseISO(selectedDate)).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      selectedTime === t ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.slice(0, 5)}
                  </button>
                ))}
                {slotsForDate(parseISO(selectedDate)).length === 0 && (
                  <p className="text-sm text-slate-500">Sem horários disponíveis neste dia.</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPhase("choose")}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={() => selectedDate && selectedTime && createAppointment(selectedDate, selectedTime)}
                disabled={busy || !selectedDate || !selectedTime}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RebookFlow;
