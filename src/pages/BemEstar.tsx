import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Heart, GraduationCap, MessageCircle, ChevronRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const MOOD_SCORES: Record<string, number> = {
  otimo: 100, bem: 80, muito_bem: 90, neutro: 60, mais_ou_menos: 55,
  ansioso: 40, nao_legal: 35, mal: 20, irritado: 30,
};

const RANGES = [
  { id: "semana", label: "Semana", days: 7 },
  { id: "mes", label: "Mês", days: 30 },
  { id: "ano", label: "Ano", days: 365 },
] as const;

type RangeId = typeof RANGES[number]["id"];

const BemEstar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [range, setRange] = useState<RangeId>("semana");

  const { data: emotions = [] } = useQuery({
    queryKey: ["bemestar-emotions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const { data } = await supabase
        .from("emotion_entries")
        .select("emotion, entry_date")
        .eq("user_id", user!.id)
        .gte("entry_date", since)
        .order("entry_date", { ascending: true });
      return data ?? [];
    },
  });

  const { series, avg, delta } = useMemo(() => {
    const cfg = RANGES.find((r) => r.id === range)!;
    const now = new Date();
    const start =
      cfg.id === "semana"
        ? subDays(now, 6)
        : cfg.id === "mes"
        ? startOfMonth(now)
        : startOfYear(now);

    const filtered = emotions.filter((e) => new Date(e.entry_date) >= start);
    const scores = filtered.map((e) => MOOD_SCORES[e.emotion] ?? 60);

    // Weekly series: last 7 days Seg-Dom
    let series: { label: string; value: number | null; isToday?: boolean }[] = [];
    if (cfg.id === "semana") {
      const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      series = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(now, 6 - i);
        const key = format(d, "yyyy-MM-dd");
        const entry = emotions.find((e) => e.entry_date === key);
        const dow = (d.getDay() + 6) % 7; // Mon=0
        return {
          label: i === 6 ? "Hoje" : labels[dow],
          value: entry ? MOOD_SCORES[entry.emotion] ?? 60 : null,
          isToday: i === 6,
        };
      });
    } else if (cfg.id === "mes") {
      // 4 buckets by week
      series = Array.from({ length: 4 }).map((_, i) => {
        const bucketStart = subDays(now, (3 - i) * 7 + 6);
        const bucketEnd = subDays(now, (3 - i) * 7);
        const items = emotions.filter((e) => {
          const d = new Date(e.entry_date);
          return d >= bucketStart && d <= bucketEnd;
        });
        const val = items.length
          ? Math.round(items.reduce((s, e) => s + (MOOD_SCORES[e.emotion] ?? 60), 0) / items.length)
          : null;
        return { label: `S${i + 1}`, value: val, isToday: i === 3 };
      });
    } else {
      const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      series = months.map((m, i) => {
        const items = emotions.filter((e) => new Date(e.entry_date).getMonth() === i);
        const val = items.length
          ? Math.round(items.reduce((s, e) => s + (MOOD_SCORES[e.emotion] ?? 60), 0) / items.length)
          : null;
        return { label: m, value: val, isToday: i === now.getMonth() };
      });
    }

    const avg = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;

    // Delta vs previous window
    const prevStart = subDays(start, differenceInCalendarDays(now, start) + 1);
    const prev = emotions.filter((e) => {
      const d = new Date(e.entry_date);
      return d >= prevStart && d < start;
    });
    const prevAvg = prev.length
      ? Math.round(prev.reduce((s, e) => s + (MOOD_SCORES[e.emotion] ?? 60), 0) / prev.length)
      : 0;
    const delta = prevAvg ? avg - prevAvg : 0;

    return { series, avg, delta };
  }, [emotions, range]);

  const message =
    avg >= 70
      ? delta > 0
        ? "Excelente! Você está melhor que na semana passada."
        : "Ótimo equilíbrio! Continue cuidando de você."
      : avg > 0
      ? "Atenção ao seu bem-estar. Que tal um check-in hoje?"
      : "Registre seu humor para acompanhar seu equilíbrio.";

  const shortcuts = [
    {
      icon: Heart,
      title: "Encontre um Terapeuta",
      desc: "Profissionais especializados para cuidar da sua mente.",
      path: "/terapeutas",
    },
    {
      icon: GraduationCap,
      title: "FanatiClass",
      desc: "Cursos e conteúdos para sua evolução dentro e fora de campo.",
      path: "/cursos",
    },
    {
      icon: MessageCircle,
      title: "Resenha Fanática",
      desc: "Conversas que inspiram, informam e conectam.",
      path: "/quiz",
    },
  ];

  const todayIdx = series.findIndex((s) => s.isToday && s.value !== null);
  const todayPoint = todayIdx >= 0 ? series[todayIdx] : null;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 normal-case">
      <Header title="Bem-estar" />

      <div className="pt-[calc(env(safe-area-inset-top)+64px)] px-4">
        {/* Título removido conforme solicitado; mantido apenas no Header */}
      </div>

      {/* Range tabs */}
      <div className="px-4 mt-[1cm]">
        <div className="rounded-full bg-white border border-slate-200 p-1 grid grid-cols-3 gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "py-2 rounded-full text-sm font-semibold transition-colors",
                range === r.id
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "text-slate-500"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Balance card */}
      <section className="mx-4 mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="font-sans text-lg font-bold text-slate-900 !normal-case"
              style={{ textTransform: "none" }}
            >
              Seu equilíbrio emocional
            </h2>
            <p className="text-5xl font-extrabold text-emerald-600 mt-2 leading-none">
              {avg}%
            </p>
            <p className="text-sm text-slate-500 mt-3 max-w-[15rem] leading-snug">
              {message}
            </p>
          </div>
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="#dcfce7" strokeWidth="10" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke="#16a34a" strokeWidth="10" fill="none"
                strokeDasharray={`${(avg / 100) * 264} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {avg >= 70 ? "🙂" : avg >= 40 ? "😐" : "🙁"}
            </div>
          </div>
        </div>

        <div className="mt-5 h-[220px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const isToday = payload.value === "Hoje";
                  return (
                    <text
                      x={x} y={y + 14}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={isToday ? 700 : 500}
                      fill={isToday ? "#16a34a" : "#94a3b8"}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12,
                }}
                formatter={(v: number) => [`${v}%`, "Equilíbrio"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              {todayPoint && todayPoint.value !== null && (
                <ReferenceDot
                  x={todayPoint.label}
                  y={todayPoint.value}
                  r={6}
                  fill="#16a34a"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Quick access cards */}
      <div className="px-4 mt-4 space-y-3">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="w-full text-left rounded-3xl bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-sans font-bold text-slate-900 !normal-case"
                  style={{ textTransform: "none" }}
                >
                  {s.title}
                </p>
                <p className="text-sm text-slate-500 leading-snug mt-0.5">{s.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-600 shrink-0" />
            </button>
          );
        })}
      </div>

      <div aria-hidden className="h-28" />
      <BottomNav />
    </div>
  );
};

export default BemEstar;