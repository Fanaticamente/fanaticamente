import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart, Flame, Trophy, GraduationCap, CalendarDays, Smile,
  TrendingUp, ChevronRight, Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "muito_bem",     emoji: "😄", label: "Muito bem",     score: 100 },
  { id: "mais_ou_menos", emoji: "🙂", label: "Mais ou menos", score: 75 },
  { id: "nao_legal",     emoji: "😐", label: "Não estou legal", score: 50 },
  { id: "ansioso",       emoji: "😟", label: "Ansioso",       score: 30 },
  { id: "irritado",      emoji: "😠", label: "Irritado",      score: 15 },
];

const scoreOf = (emotion: string) =>
  MOODS.find((m) => m.id === emotion)?.score ?? 50;

const MinhaTemporada = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: emotions = [] } = useQuery({
    queryKey: ["mt-emotions-90", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const { data } = await supabase
        .from("emotion_entries")
        .select("emotion, entry_date, note, created_at")
        .eq("user_id", user!.id)
        .gte("entry_date", since)
        .order("entry_date", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["mt-appointments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, status, scheduled_date, scheduled_time")
        .eq("user_id", user!.id)
        .order("scheduled_date", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["mt-courses-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_course_access")
        .select("id, created_at, course_id, courses(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const last7 = emotions.filter((e) => differenceInCalendarDays(new Date(), new Date(e.entry_date)) < 7);
    const avgScore = last7.length
      ? Math.round(last7.reduce((s, e) => s + scoreOf(e.emotion), 0) / last7.length)
      : 0;
    // Emoji do mood mais próximo do avgScore
    const avgEmoji = last7.length
      ? MOODS.reduce((closest, m) =>
          Math.abs(m.score - avgScore) < Math.abs(closest.score - avgScore) ? m : closest,
        MOODS[0]).emoji
      : "";

    const days = new Set(emotions.map((e) => e.entry_date));
    let streak = 0;
    let cursor = new Date();
    if (!days.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
    while (days.has(format(cursor, "yyyy-MM-dd"))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    const monthStart = startOfMonth(new Date());
    const monthCheckins = emotions.filter((e) => new Date(e.entry_date) >= monthStart).length;
    const sessionsDone = appointments.filter((a) => a.status === "completed").length;
    const sessionsUpcoming = appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
    const coursesCount = courses.length;
    const checkinsCount = emotions.length;

    // Pontuação: 3pts por sessão concluída, 1pt por check-in, 1pt por curso
    const points = sessionsDone * 3 + checkinsCount + coursesCount;

    return { avgScore, avgEmoji, streak, monthCheckins, sessionsDone, sessionsUpcoming, coursesCount, checkinsCount, points };
  }, [emotions, appointments, courses]);

  const timeline = useMemo(() => {
    type Item = { icon: any; when: string; title: string; body: string; onClick?: () => void };
    const items: Item[] = [];
    if (emotions[0]) {
      const mood = MOODS.find((m) => m.id === emotions[0].emotion);
      const dLabel = emotions[0].entry_date === format(new Date(), "yyyy-MM-dd")
        ? "Hoje"
        : format(new Date(emotions[0].entry_date), "dd 'de' MMM", { locale: ptBR });
      items.push({
        icon: Smile, when: dLabel,
        title: `Check-in: ${mood?.label ?? emotions[0].emotion}`,
        body: "Continue acompanhando suas emoções.",
        onClick: () => navigate("/bem-estar"),
      });
    }
    if (courses[0]) {
      const title = (courses[0] as any).courses?.title ?? "Curso liberado";
      items.push({
        icon: GraduationCap,
        when: format(new Date((courses[0] as any).created_at), "dd 'de' MMM", { locale: ptBR }),
        title, body: "Continue seus estudos na FanatiClass.",
        onClick: () => navigate("/meus-cursos"),
      });
    }
    const lastAppt = appointments[0];
    if (lastAppt) {
      items.push({
        icon: CalendarDays,
        when: format(new Date(lastAppt.scheduled_date), "dd 'de' MMM", { locale: ptBR }),
        title: lastAppt.status === "completed" ? "Sessão concluída" : "Sessão agendada",
        body: "Confira detalhes em Meus agendamentos.",
        onClick: () => navigate("/meus-agendamentos"),
      });
    }
    return items;
  }, [emotions, courses, appointments, navigate]);

  const Content = () => (
    <div className="font-sans text-slate-900 space-y-5">
      {/* Pontuação total */}
      <section
        className="rounded-3xl p-5 text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, var(--club-500) 0%, var(--club-700) 100%)",
          color: "var(--club-on)",
        }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
          <Trophy className="w-4 h-4" /> Sua pontuação
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl font-extrabold leading-none">{stats.points}</span>
          <span className="text-sm opacity-80 pb-1">pontos acumulados</span>
        </div>
        <p className="text-xs opacity-80 mt-2">
          3 pts por sessão · 1 pt por check-in · 1 pt por curso
        </p>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Heart className="w-4 h-4" />} label="Humor médio (7d)" value={stats.avgEmoji || "—"} />
        <MetricCard icon={<Flame className="w-4 h-4" />} label="Sequência" value={`${stats.streak} dia${stats.streak === 1 ? "" : "s"}`} />
        <MetricCard icon={<Smile className="w-4 h-4" />} label="Check-ins no mês" value={`${stats.monthCheckins}`} />
        <MetricCard icon={<CalendarDays className="w-4 h-4" />} label="Sessões concluídas" value={`${stats.sessionsDone}`} hint={stats.sessionsUpcoming ? `${stats.sessionsUpcoming} agendadas` : undefined} />
        <MetricCard icon={<GraduationCap className="w-4 h-4" />} label="Cursos" value={`${stats.coursesCount}`} />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Check-ins totais" value={`${stats.checkinsCount}`} />
      </section>

      {/* Atividades */}
      <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[var(--club-600)]" />
          <h3 className="font-bold normal-case">Suas atividades recentes</h3>
        </div>

        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ainda não temos atividades para mostrar. Faça um check-in ou agende uma sessão.
          </p>
        ) : (
          <div className="space-y-3">
            {timeline.map((it, i) => {
              const Icon = it.icon;
              return (
                <button
                  key={i}
                  onClick={it.onClick}
                  className="w-full text-left flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--club-600)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--club-600)]">{it.when}</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{it.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{it.body}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 mt-3 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Atalhos */}
      <section className="grid grid-cols-1 gap-3">
        <ShortcutButton onClick={() => navigate("/meus-agendamentos")} icon={<CalendarDays className="w-4 h-4" />} label="Meus agendamentos" />
        <ShortcutButton onClick={() => navigate("/meus-cursos")} icon={<GraduationCap className="w-4 h-4" />} label="Meus cursos" />
      </section>

      {/* Insight */}
      <section className="rounded-3xl bg-[var(--club-50)] border border-[var(--club-100)] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-[var(--club-600)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {stats.streak >= 3
              ? `Temporada em ritmo forte: ${stats.streak} dias seguidos`
              : stats.points > 0
              ? "Sua temporada está em andamento"
              : "Sua temporada começa agora"}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {stats.streak >= 3
              ? `Você já soma ${stats.points} pontos na plataforma. Mantenha a sequência para subir no ranking.`
              : stats.points > 0
              ? `${stats.points} pontos conquistados até aqui. Use o app todos os dias para somar mais e avançar na classificação.`
              : "Participe das atividades do app para somar pontos e disputar posição no ranking da comunidade."}
          </p>
        </div>
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header title="Minha temporada" />
        <main className="pt-[calc(56px+1cm)] px-4 pb-32">
          <Content />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Minha Temporada" subtitle="Seu painel pessoal de torcedor">
      <Content />
    </UserDesktopLayout>
  );
};

const MetricCard = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
    <div className="flex items-center gap-1.5 text-[var(--club-600)]">
      {icon}
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
    </div>
    <p className="text-2xl font-extrabold text-slate-900 mt-1 leading-none">{value}</p>
    {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
  </div>
);

const ShortcutButton = ({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4 flex items-center gap-3 text-left"
  >
    <div className="w-9 h-9 rounded-xl bg-[var(--club-50)] flex items-center justify-center text-[var(--club-600)]">
      {icon}
    </div>
    <span className="text-sm font-semibold text-slate-900 flex-1 min-w-0 truncate">{label}</span>
    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
  </button>
);

export default MinhaTemporada;