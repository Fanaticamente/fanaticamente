import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { CalendarDays, Users, GraduationCap, Play, TrendingUp, ChevronRight, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import soccerBall from "@/assets/home-soccer-ball.png";

const MOODS = [
  { id: "muito_bem", emoji: "🙂", label: "Muito bem",     bg: "bg-emerald-100", ring: "ring-emerald-400" },
  { id: "mais_ou_menos", emoji: "😐", label: "Mais ou menos", bg: "bg-amber-100",   ring: "ring-amber-400" },
  { id: "nao_legal", emoji: "🙁", label: "Não estou legal", bg: "bg-orange-100",  ring: "ring-orange-400" },
  { id: "ansioso", emoji: "😟", label: "Ansioso",         bg: "bg-slate-100",   ring: "ring-slate-400" },
  { id: "irritado", emoji: "😠", label: "Irritado",        bg: "bg-rose-100",    ring: "ring-rose-400" },
];

const MinimalHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["mh-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const firstName = (profile?.full_name || "torcedor").split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const { data: emotions = [] } = useQuery({
    queryKey: ["mh-emotions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const { data } = await supabase
        .from("emotion_entries")
        .select("entry_date")
        .eq("user_id", user!.id)
        .gte("entry_date", since);
      return data ?? [];
    },
  });

  const weekActivities = useMemo(
    () => emotions.filter((e) => differenceInCalendarDays(new Date(), new Date(e.entry_date)) < 7).length,
    [emotions]
  );
  const progressPct = Math.min(100, Math.round((weekActivities / 10) * 100));

  const checkinMutation = useMutation({
    mutationFn: async (moodId: string) => {
      if (!user) throw new Error("no-user");
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("emotion_entries")
        .upsert(
          { user_id: user.id, emotion: moodId, entry_date: today },
          { onConflict: "user_id,entry_date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-in registrado! 💚");
      qc.invalidateQueries({ queryKey: ["mh-emotions"] });
      setSelected(null);
    },
    onError: () => toast.error("Não foi possível registrar."),
  });

  const shortcuts = [
    { icon: CalendarDays, label: "Consultas", path: "/meus-agendamentos" },
    { icon: Users,        label: "Terapeutas", path: "/terapeutas" },
    { icon: GraduationCap,label: "Cursos",     path: "/cursos" },
    { icon: HeartPulse,   label: "Bem-estar",  path: "/setor-saude" },
  ];

  return (
    <div className="font-sans text-slate-900 space-y-5 pb-4">
      {/* Greeting + soccer ball */}
      <section className="relative overflow-hidden">
        <img
          src={soccerBall}
          alt=""
          aria-hidden
          className="absolute -top-6 -right-8 w-40 h-40 object-contain opacity-95 pointer-events-none select-none"
        />
        <div
          aria-hidden
          className="absolute -top-4 right-16 w-56 h-56 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #10b981 1.2px, transparent 1.2px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="relative pt-2 pr-32">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            {greeting},{" "}
            <span className="text-emerald-600">{firstName}!</span>{" "}
            <span className="inline-block">👋</span>
          </h1>
          <p className="mt-2 text-slate-500 text-[15px] leading-snug max-w-[16rem]">
            Que tal cuidar da sua mente como você cuida do seu time?
          </p>
        </div>
      </section>

      {/* Check-in */}
      <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold tracking-wider">
          <HeartPulse className="w-4 h-4" />
          CHECK-IN EMOCIONAL
        </div>
        <h2 className="mt-1.5 text-xl font-bold">Como você está hoje?</h2>
        <p className="text-sm text-slate-500 mt-1">
          Sua resposta nos ajuda a cuidar de você melhor.
        </p>

        <div className="grid grid-cols-5 gap-2 mt-4">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all",
                  m.bg,
                  selected === m.id ? `ring-2 ${m.ring} scale-105` : "opacity-90"
                )}
              >
                {m.emoji}
              </div>
              <span className="text-[10.5px] font-semibold text-slate-700 leading-tight text-center">
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <button
            disabled={checkinMutation.isPending}
            onClick={() => checkinMutation.mutate(selected)}
            className="mt-4 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {checkinMutation.isPending ? "Registrando…" : "Registrar check-in"}
          </button>
        )}
      </section>

      {/* Sugestão */}
      <button
        onClick={() => navigate("/diario")}
        className="w-full text-left rounded-3xl bg-white border border-slate-200/70 shadow-sm p-4 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
          <span className="text-2xl">⚽</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-emerald-600">
            SUGESTÃO PARA VOCÊ
          </p>
          <p className="font-bold text-slate-900 truncate">Respiração para ansiedade</p>
          <p className="text-xs text-slate-500">Exercício de 2 min</p>
        </div>
        <div className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
        </div>
      </button>

      {/* Acesso rápido */}
      <section>
        <h3 className="font-bold text-slate-900 mb-2 px-1">Acesso rápido</h3>
        <div className="grid grid-cols-4 gap-2.5">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.path}
                onClick={() => navigate(s.path)}
                className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-3 flex flex-col items-center gap-2 aspect-square justify-center"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sua jornada */}
      <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold">Sua jornada</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Você completou {weekActivities} atividade{weekActivities === 1 ? "" : "s"} esta semana.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-emerald-600">{progressPct}%</span>
            </div>

            <button
              onClick={() => navigate("/minha-temporada")}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"
            >
              Ver evolução detalhada <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="text-3xl">🛡️</span>
          </div>
        </div>
      </section>

      {/* Torcida */}
      <button
        onClick={() => navigate("/ranking")}
        className="w-full text-left rounded-3xl bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight">
            Torcida que apoia, mente que fica!
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Veja como sua torcida está cuidando da mente.
          </p>
          <p className="text-sm font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
            Ver ranking <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>
      </button>
    </div>
  );
};

export default MinimalHome;