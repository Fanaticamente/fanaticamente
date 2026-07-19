import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell, Heart, Flame, Trophy, GraduationCap, FileText, Smile,
  TrendingUp, Target, ChevronRight, Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "otimo",   emoji: "😄", label: "Ótimo",     score: 100, color: "bg-green-500" },
  { id: "bem",     emoji: "🙂", label: "Bem",       score: 80,  color: "bg-green-500" },
  { id: "neutro",  emoji: "😐", label: "Neutro",    score: 60,  color: "bg-yellow-400" },
  { id: "ansioso", emoji: "😟", label: "Ansioso",   score: 40,  color: "bg-orange-500" },
  { id: "mal",     emoji: "😞", label: "Muito mal", score: 20,  color: "bg-red-500" },
];

const scoreOf = (emotion: string) =>
  MOODS.find((m) => m.id === emotion)?.score ?? 60;

const MinhaTemporada = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Profile + saudação
  const { data: profile } = useQuery({
    queryKey: ["mt-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, favorite_club_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const greetName = (profile?.full_name || "torcedor").split(" ")[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  // Próximo jogo do clube favorito
  const { data: nextMatch } = useQuery({
    queryKey: ["mt-next-match", profile?.favorite_club_id],
    enabled: !!profile?.favorite_club_id,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("upcoming_matches")
        .select("*")
        .eq("club_id", profile!.favorite_club_id!)
        .gte("match_date", today)
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Emotion entries (30 dias)
  const { data: emotions = [] } = useQuery({
    queryKey: ["mt-emotions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data } = await supabase
        .from("emotion_entries")
        .select("*")
        .eq("user_id", user!.id)
        .gte("entry_date", since)
        .order("entry_date", { ascending: false });
      return data ?? [];
    },
  });

  // Jogos acompanhados (match_expectations)
  const { data: expectations = [] } = useQuery({
    queryKey: ["mt-expectations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("match_expectations")
        .select("id, created_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  // Cursos e ranking (jornada)
  const { data: coursesDone = [] } = useQuery({
    queryKey: ["mt-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_course_access")
        .select("id, created_at, course_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  // Desafio da semana
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: challenge } = useQuery({
    queryKey: ["mt-challenge", weekStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", true)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: myProgress } = useQuery({
    queryKey: ["mt-progress", user?.id, challenge?.id],
    enabled: !!user && !!challenge,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_challenge_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("challenge_id", challenge!.id)
        .maybeSingle();
      return data;
    },
  });

  // Métricas calculadas
  const stats = useMemo(() => {
    // Humor médio últimos 7 dias
    const last7 = emotions.filter(
      (e) => differenceInCalendarDays(new Date(), new Date(e.entry_date)) < 7
    );
    const avgScore = last7.length
      ? Math.round(last7.reduce((s, e) => s + scoreOf(e.emotion), 0) / last7.length)
      : 0;
    // Semana anterior
    const prev7 = emotions.filter((e) => {
      const d = differenceInCalendarDays(new Date(), new Date(e.entry_date));
      return d >= 7 && d < 14;
    });
    const prevAvg = prev7.length
      ? Math.round(prev7.reduce((s, e) => s + scoreOf(e.emotion), 0) / prev7.length)
      : 0;
    const delta = prevAvg ? avgScore - prevAvg : 0;

    // Sequência de dias consecutivos com check-in
    const days = new Set(emotions.map((e) => e.entry_date));
    let streak = 0;
    let cursor = new Date();
    if (!days.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
    while (days.has(format(cursor, "yyyy-MM-dd"))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    // Jogos acompanhados este mês
    const monthStart = startOfMonth(new Date());
    const thisMonthGames = expectations.filter(
      (m) => new Date(m.created_at) >= monthStart
    ).length;

    return {
      avgScore, delta,
      streak,
      totalGames: expectations.length,
      thisMonthGames,
    };
  }, [emotions, expectations]);

  // Timeline dinâmica
  const timeline = useMemo(() => {
    const items: Array<{
      icon: React.ComponentType<{ className?: string }>;
      iconBg: string;
      when: string;
      title: string;
      body: string;
      action?: { label: string; onClick: () => void };
    }> = [];

    if (emotions[0]) {
      const mood = MOODS.find((m) => m.id === emotions[0].emotion);
      const dLabel =
        emotions[0].entry_date === format(new Date(), "yyyy-MM-dd")
          ? "Hoje"
          : format(new Date(emotions[0].entry_date), "dd 'de' MMM", { locale: ptBR });
      items.push({
        icon: Smile,
        iconBg: "bg-green-500/20 text-green-400",
        when: dLabel,
        title: `Você registrou humor: ${mood?.label ?? emotions[0].emotion}`,
        body: "Continue acompanhando suas emoções 💚",
      });
    }

    if (coursesDone[0]) {
      items.push({
        icon: GraduationCap,
        iconBg: "bg-purple-500/20 text-purple-400",
        when: format(new Date(coursesDone[0].created_at), "dd 'de' MMM", { locale: ptBR }),
        title: "Curso liberado",
        body: "Continue seus estudos na FanatiClass.",
        action: { label: "Meus cursos", onClick: () => navigate("/meus-cursos") },
      });
    }

    if (expectations[0]) {
      items.push({
        icon: Trophy,
        iconBg: "bg-yellow-500/20 text-yellow-400",
        when: format(new Date(expectations[0].created_at), "dd 'de' MMM", { locale: ptBR }),
        title: "Expectativa de jogo registrada",
        body: "Você acompanhou como se sentiu antes da partida.",
        action: { label: "Ver diário", onClick: () => navigate("/diario") },
      });
    }

    items.push({
      icon: FileText,
      iconBg: "bg-blue-500/20 text-blue-400",
      when: "Setor Saúde",
      title: "Novos artigos disponíveis",
      body: "Confira conteúdos de bem-estar mental para torcedores.",
      action: { label: "Ler agora", onClick: () => navigate("/setor-saude") },
    });

    return items;
  }, [emotions, coursesDone, expectations, navigate]);

  // Check-in
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

      // Atualiza progresso do desafio
      if (challenge) {
        const nextProgress = Math.min(
          (myProgress?.progress ?? 0) + 1,
          challenge.target_count
        );
        await supabase.from("user_challenge_progress").upsert(
          {
            user_id: user.id,
            challenge_id: challenge.id,
            progress: nextProgress,
          },
          { onConflict: "user_id,challenge_id" }
        );
      }
    },
    onSuccess: () => {
      toast.success("Check-in registrado! 💚");
      qc.invalidateQueries({ queryKey: ["mt-emotions"] });
      qc.invalidateQueries({ queryKey: ["mt-progress"] });
      setSelectedMood(null);
    },
    onError: () => toast.error("Não foi possível registrar. Tente novamente."),
  });

  const progressPct = challenge
    ? Math.min(100, Math.round(((myProgress?.progress ?? 0) / challenge.target_count) * 100))
    : 0;

  const Content = () => (
    <div className="space-y-5">
      {/* Saudação */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">
            {greeting}, {greetName} <span className="inline-block">👋</span>
          </h1>
          {nextMatch && (
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">
                Jogo {nextMatch.is_home ? "em casa" : "fora"} vs {nextMatch.opponent}
                {nextMatch.match_time ? ` às ${nextMatch.match_time}` : ""}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/notificacoes")}
            className="relative p-2 rounded-full bg-white/5 border border-white/10"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full" />
          </button>
          <button
            onClick={() => navigate("/perfil")}
            className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10"
            aria-label="Perfil"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm">
                {greetName[0]?.toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Como você está hoje? */}
      <section className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-950/40 to-black p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Como você está hoje?</h2>
            <p className="text-xs text-muted-foreground">Check-in diário de emoções</p>
          </div>
          <Heart className="w-8 h-8 text-green-400 opacity-60" />
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
                selectedMood === m.id
                  ? "bg-white/10 ring-2 ring-green-400 scale-105"
                  : "hover:bg-white/5"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl", m.color)}>
                {m.emoji}
              </div>
              <span className="text-[10px] text-white/80 leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>
        <button
          disabled={!selectedMood || checkinMutation.isPending}
          onClick={() => selectedMood && checkinMutation.mutate(selectedMood)}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold transition disabled:opacity-50"
        >
          {checkinMutation.isPending ? "Registrando…" : "Fazer check-in"}
        </button>
      </section>

      {/* Seu momento */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">Seu momento</h3>
          <button
            onClick={() => navigate("/diario")}
            className="text-xs text-green-400 flex items-center gap-1"
          >
            Ver evolução <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            icon={<Heart className="w-5 h-5 text-green-400" />}
            label="Humor médio"
            value={`${stats.avgScore}%`}
            hint={stats.delta ? `${stats.delta > 0 ? "+" : ""}${stats.delta}% vs semana passada` : "Registre seu humor"}
          />
          <MetricCard
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            label="Sequência"
            value={`${stats.streak} dias`}
            hint={stats.streak >= 3 ? "Continue assim!" : "Comece uma sequência"}
          />
          <MetricCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label="Jogos"
            value={`${stats.totalGames}`}
            hint={`+${stats.thisMonthGames} este mês`}
          />
        </div>
      </section>

      {/* Sua jornada */}
      <section>
        <h3 className="text-white font-bold mb-3">Sua jornada</h3>
        <div className="relative space-y-3">
          {timeline.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", it.iconBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 my-1" />
                  )}
                </div>
                <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-green-400 font-medium">{it.when}</p>
                      <p className="text-sm font-semibold text-white leading-tight mt-0.5">{it.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{it.body}</p>
                    </div>
                    {it.action && (
                      <button
                        onClick={it.action.onClick}
                        className="text-xs text-green-400 shrink-0 flex items-center gap-0.5"
                      >
                        {it.action.label} <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Insights */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">Insights para você</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {stats.avgScore >= 70
                ? "Seu humor está estável"
                : stats.avgScore > 0
                ? "Atenção ao seu bem-estar"
                : "Comece a acompanhar seu humor"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgScore >= 70
                ? "Você tem mantido um bom equilíbrio emocional na semana. Continue com os check-ins."
                : stats.avgScore > 0
                ? "Seu humor médio caiu esta semana. Que tal falar com um profissional?"
                : "Faça check-ins diários para desbloquear seus insights personalizados."}
            </p>
            <button
              onClick={() => navigate("/terapeutas")}
              className="mt-3 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-semibold"
            >
              Ver terapeutas
            </button>
          </div>
        </div>
      </section>

      {/* Desafio da semana */}
      {challenge && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-bold flex-1">Desafio da semana</h3>
            <span className="text-xs text-green-400 font-semibold">
              {myProgress?.progress ?? 0}/{challenge.target_count}
            </span>
          </div>
          <p className="text-sm text-white">{challenge.title}</p>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
          )}
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Minha temporada" />
        <main className="pt-20 px-4">
          <Content />
          <div aria-hidden className="h-28" />
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

const MetricCard = ({
  icon, label, value, hint,
}: { icon: React.ReactNode; label: string; value: string; hint: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="mb-1">{icon}</div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-lg font-bold text-white leading-tight mt-0.5">{value}</p>
    <p className="text-[10px] text-green-400 mt-0.5 truncate">{hint}</p>
  </div>
);

export default MinhaTemporada;