import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { CalendarDays, Users, GraduationCap, Play, TrendingUp, ChevronRight, HeartPulse, Radio, Newspaper, Trophy, BookOpen } from "lucide-react";
import jornadaShield from "@/assets/jornada-shield.svg.asset.json";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "muito_bem", emoji: "🙂", label: "Muito bem",     bg: "bg-emerald-100", ring: "ring-emerald-400" },
  { id: "mais_ou_menos", emoji: "😐", label: "Mais ou menos", bg: "bg-amber-100",   ring: "ring-amber-400" },
  { id: "nao_legal", emoji: "🙁", label: "Não estou legal", bg: "bg-orange-100",  ring: "ring-orange-400" },
  { id: "ansioso", emoji: "😟", label: "Ansioso",         bg: "bg-slate-100",   ring: "ring-slate-400" },
  { id: "irritado", emoji: "😠", label: "Irritado",        bg: "bg-rose-100",    ring: "ring-rose-400" },
];

const SUGGESTIONS = [
  { emoji: "🫁", kicker: "Sugestão para você", title: "Respiração para ansiedade", subtitle: "Exercício de 2 min", path: "/diario", icon: Play },
  { emoji: "🧠", kicker: "Curso em destaque", title: "Inteligência emocional no futebol", subtitle: "Assista agora", path: "/cursos", icon: BookOpen },
  { emoji: "🩺", kicker: "Cuide de você", title: "Converse com um especialista", subtitle: "Terapeutas disponíveis", path: "/terapeutas", icon: Users },
  { emoji: "📻", kicker: "Ao vivo", title: "Rádio Alambrado FM", subtitle: "Escute agora", path: "/radio", icon: Radio },
  { emoji: "📰", kicker: "Fique por dentro", title: "Notícias do seu clube", subtitle: "Últimas atualizações", path: "/futebol", icon: Newspaper },
  { emoji: "🏆", kicker: "Comunidade", title: "Ranking Brasileirão da mente", subtitle: "Veja como sua torcida está", path: "/ranking", icon: Trophy },
];

const MinimalHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [sugIdx, setSugIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSugIdx((i) => (i + 1) % SUGGESTIONS.length), 4500);
    return () => clearInterval(t);
  }, []);

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
      {/* Greeting */}
      <section className="pt-0">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight leading-none normal-case flex items-center gap-1 whitespace-nowrap">
          {greeting},{" "}
          <span className="text-emerald-600">{firstName}!</span>{" "}
          <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1.5 text-slate-500 text-[15px] leading-snug">
          Saúde Mental agora é papo de arquibancada!
        </p>
      </section>

      {/* Check-in */}
      <section className="mt-[19px] rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
          <HeartPulse className="w-4 h-4" />
          Check-in emocional
        </div>
        <h2 className="font-sans mt-1.5 text-xl font-bold normal-case">Como você está hoje?</h2>
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

      {/* Sugestões carrossel */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/70 shadow-sm">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${sugIdx * 100}%)` }}
          >
            {SUGGESTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.path + s.title}
                  onClick={() => navigate(s.path)}
                  className="w-full shrink-0 text-left p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="text-2xl">{s.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-emerald-600">{s.kicker}</p>
                    <p className="font-bold text-slate-900 truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>
                  </div>
                  <div className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {SUGGESTIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setSugIdx(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === sugIdx ? "w-5 bg-emerald-500" : "w-1.5 bg-slate-300"
              )}
              aria-label={`Ir para sugestão ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Acesso rápido */}
      <section>
        <h3 className="font-sans font-bold text-slate-900 mb-2 px-1 normal-case tracking-normal">Acesso rápido</h3>
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
              <h3 className="font-sans font-bold normal-case tracking-normal">Sua jornada</h3>
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
            <img src={jornadaShield.url} alt="" className="w-10 h-10 object-contain" />
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