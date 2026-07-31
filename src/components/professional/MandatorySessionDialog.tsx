import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Clock, User, Phone, MapPin, Link as LinkIcon, Play, Square,
  CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, parseISO, addDays, addWeeks, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ActiveSessionAppointment } from "@/hooks/useProfessionalSessionAlert";

interface Props {
  appointment: ActiveSessionAppointment;
  onFinished: (id: string) => void;
}

type Phase = "session" | "ask" | "choose" | "calendar";

const MandatorySessionDialog = ({ appointment, onFinished }: Props) => {
  const [phase, setPhase] = useState<Phase>(
    appointment.status === "in_progress" ? "session" : "session"
  );
  const [status, setStatus] = useState(appointment.status);
  const [link, setLink] = useState(appointment.consultation_link || "");
  const [busy, setBusy] = useState(false);

  // calendar state
  const [availability, setAvailability] = useState<{ day_of_week: number; time_slots: string[] }[]>([]);
  const [booked, setBooked] = useState<{ scheduled_date: string; scheduled_time: string }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const start = parseISO(`${appointment.scheduled_date}T${appointment.scheduled_time}`);

  useEffect(() => {
    // Prevent background scroll while the mandatory dialog is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (phase !== "calendar") return;
    (async () => {
      const [{ data: avail }, { data: apts }] = await Promise.all([
        supabase
          .from("professional_weekly_availability")
          .select("day_of_week, time_slots")
          .eq("professional_id", appointment.professional_id),
        supabase
          .from("appointments")
          .select("scheduled_date, scheduled_time")
          .eq("professional_id", appointment.professional_id)
          .gte("scheduled_date", new Date().toISOString().slice(0, 10))
          .not("status", "in", '("cancelled","rejected")'),
      ]);
      setAvailability((avail as { day_of_week: number; time_slots: string[] }[] | null) || []);
      setBooked(apts || []);
    })();
  }, [phase, appointment.professional_id]);

  const days = useMemo(() => {
    const base = addDays(new Date(), 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [weekOffset]);

  const slotsForDate = (date: Date) => {
    const dow = date.getDay();
    const entry = availability.find((a) => a.day_of_week === dow);
    if (!entry) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return (entry.time_slots || []).filter(
      (t) => !booked.some((b) => b.scheduled_date === dateStr && b.scheduled_time.slice(0, 5) === t.slice(0, 5))
    );
  };

  const updateStatus = async (next: string, extra: Record<string, unknown> = {}) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: next, ...extra })
      .eq("id", appointment.id);
    if (error) throw error;
    setStatus(next);
  };

  const handleSendLink = async () => {
    if (!link.trim()) return;
    setBusy(true);
    try {
      await updateStatus(status === "in_progress" ? "in_progress" : "link_sent", {
        consultation_link: link.trim(),
      });
      toast.success("Link enviado ao paciente!");
    } catch {
      toast.error("Erro ao enviar link");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      await updateStatus("in_progress");
      toast.success("Sessão iniciada!");
    } catch {
      toast.error("Erro ao iniciar a sessão");
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    setPhase("ask");
  };

  const finishSession = async () => {
    setBusy(true);
    try {
      await updateStatus("completed");
      toast.success("Sessão concluída com sucesso!");
      onFinished(appointment.id);
    } catch {
      toast.error("Erro ao concluir a sessão");
    } finally {
      setBusy(false);
    }
  };

  const createAppointment = async (date: string, time: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: appointment.user_id,
        professional_id: appointment.professional_id,
        scheduled_date: date,
        scheduled_time: time,
        status: "confirmed",
      });
      if (error) throw error;
      toast.success(
        `Nova consulta marcada para ${format(parseISO(date), "dd/MM/yyyy")} às ${time.slice(0, 5)}`
      );
      await finishSession();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao marcar a nova consulta");
    } finally {
      setBusy(false);
    }
  };

  const handleRepeat = () => {
    const next = addWeeks(parseISO(appointment.scheduled_date), 1);
    createAppointment(format(next, "yyyy-MM-dd"), appointment.scheduled_time);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[calc(100%-1rem)] max-w-lg max-h-[85vh] overflow-auto">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">
            {phase === "session" ? "Sessão em andamento" : "Nova consulta"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {phase === "session"
              ? "Conclua a sessão para liberar o aplicativo."
              : "Finalize este passo para liberar o aplicativo."}
          </p>
        </div>

        {phase === "session" && (
          <div className="p-4 space-y-5">
            {/* Patient */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {appointment.patient?.avatar_url ? (
                  <img
                    src={appointment.patient.avatar_url}
                    alt={appointment.patient?.full_name || "Paciente"}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">
                    {appointment.patient?.full_name || "Paciente"}
                  </p>
                  {appointment.patient?.birth_date && (
                    <p className="text-sm text-slate-500">
                      {differenceInYears(new Date(), parseISO(appointment.patient.birth_date))} anos
                    </p>
                  )}
                </div>
              </div>
              {appointment.patient?.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" /> {appointment.patient.phone}
                </div>
              )}
              {appointment.patient?.city && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" /> {appointment.patient.city}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                {format(start, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                {appointment.scheduled_time.slice(0, 5)}
              </div>
            </div>

            {/* Link (optional) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Link da consulta online (opcional)
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full h-11 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <button
                  onClick={handleSendLink}
                  disabled={busy || !link.trim()}
                  className="px-4 rounded-xl bg-slate-800 text-white text-sm font-medium disabled:opacity-40"
                >
                  Enviar
                </button>
              </div>
              {appointment.consultation_link && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> Link já enviado ao paciente
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-700">
                  Orientação: envie o link até <strong>10 minutos antes</strong> do horário agendado.
                </p>
              </div>
            </div>

            {status !== "in_progress" ? (
              <button
                onClick={handleStart}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Iniciar Sessão
              </button>
            ) : (
              <button
                onClick={handleEnd}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Encerrar Sessão
              </button>
            )}
          </div>
        )}

        {phase === "ask" && (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-lg font-semibold text-slate-800">
              Marcar uma nova consulta com este paciente?
            </p>
            <div className="flex gap-3">
              <button
                 onClick={finishSession}
                 disabled={busy}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
              >
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
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-2 rounded-lg bg-slate-100"
              >
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

export default MandatorySessionDialog;
