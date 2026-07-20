import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Heart, GraduationCap, MessageCircle, ChevronRight, Users, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays, startOfMonth, startOfYear, parseISO, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"semana" | "mes" | "historico">("semana");

  const { data: emotions = [] } = useQuery({
    queryKey: ["bemestar-emotions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const { data } = await supabase
        .from("emotion_entries")
        .select("emotion, entry_date, note, created_at")
        .eq("user_id", user!.id)
        .gte("entry_date", since)
        .order("entry_date", { ascending: false });
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

  // Emoji tiers used by both chart Y-axis and legend
  const MOOD_TIERS = [
    { value: 100, label: "Ótimo", emoji: "😄" },
    { value: 75, label: "Bem", emoji: "🙂" },
    { value: 50, label: "Neutro", emoji: "😐" },
    { value: 25, label: "Chateado", emoji: "😟" },
    { value: 0, label: "Mal", emoji: "😢" },
  ];

  // Details: last 7 days grouped, last 4 weeks grouped, and full history
  const details = useMemo(() => {
    const now = new Date();
    const daily: { date: string; label: string; emotion?: string; value: number | null; note?: string | null }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      const entry = emotions.find((e) => e.entry_date === key);
      daily.push({
        date: key,
        label: i === 0 ? "Hoje" : format(d, "EEE, dd/MM", { locale: ptBR }),
        emotion: entry?.emotion,
        value: entry ? MOOD_SCORES[entry.emotion] ?? 60 : null,
        note: (entry as any)?.note ?? null,
      });
    }
    const weekly: { label: string; count: number; avg: number | null }[] = [];
    for (let i = 0; i < 4; i++) {
      const ws = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const items = emotions.filter((e) => {
        const d = parseISO(e.entry_date);
        return d >= ws && d <= we;
      });
      const avg = items.length
        ? Math.round(items.reduce((s, e) => s + (MOOD_SCORES[e.emotion] ?? 60), 0) / items.length)
        : null;
      weekly.push({
        label:
          i === 0
            ? "Esta semana"
            : `${format(ws, "dd/MM")} – ${format(we, "dd/MM")}`,
        count: items.length,
        avg,
      });
    }
    // Full history grouped by month (desc)
    const historyGroups: Record<string, typeof emotions> = {};
    emotions.forEach((e) => {
      const d = parseISO(e.entry_date);
      const key = format(d, "yyyy-MM");
      if (!historyGroups[key]) historyGroups[key] = [] as any;
      (historyGroups[key] as any).push(e);
    });
    const history = Object.keys(historyGroups)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => ({
        key: k,
        label: format(parseISO(`${k}-01`), "MMMM 'de' yyyy", { locale: ptBR }),
        entries: (historyGroups[k] as any).sort((a: any, b: any) =>
          b.entry_date.localeCompare(a.entry_date)
        ),
      }));
    return { daily, weekly, history };
  }, [emotions]);

  const emotionLabels: Record<string, string> = {
    otimo: "Ótimo", bem: "Bem", muito_bem: "Muito bem", neutro: "Neutro",
    mais_ou_menos: "Mais ou menos", ansioso: "Ansioso", nao_legal: "Não legal",
    mal: "Mal", irritado: "Irritado",
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 normal-case">
      <Header title="Bem-estar" />

      {/* Range tabs */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+56px+8px)]">
        <div className="rounded-full bg-white border border-slate-200 p-1 grid grid-cols-3 gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "py-2 rounded-full text-sm font-semibold transition-colors",
                range === r.id
                  ? "bg-[var(--club-50)] text-[var(--club-600)] border border-[var(--club-200)]"
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
            <p className="text-5xl font-extrabold text-[var(--club-600)] mt-2 leading-none">
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

        <div className="mt-5 h-[240px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
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
                      fill={isToday ? "var(--club-600)" : "#94a3b8"}
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
                width={36}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const tier = MOOD_TIERS.find((t) => t.value === payload.value);
                  return (
                    <text x={x - 4} y={y + 5} textAnchor="middle" fontSize={16}>
                      {tier?.emoji ?? ""}
                    </text>
                  );
                }}
              />
              <Tooltip
                cursor={{ stroke: "var(--club-200)", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12,
                }}
                formatter={(v: number) => {
                  const tier = [...MOOD_TIERS]
                    .sort((a, b) => Math.abs(a.value - v) - Math.abs(b.value - v))[0];
                  return [`${tier.emoji} ${tier.label}`, "Sentimento"];
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--club-600)"
                strokeWidth={3}
                dot={{ r: 5, fill: "#fff", stroke: "var(--club-600)", strokeWidth: 2.5 }}
                activeDot={{ r: 7, fill: "var(--club-600)", stroke: "#fff", strokeWidth: 2 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
          {MOOD_TIERS.map((t) => (
            <div key={t.value} className="flex items-center gap-1 text-xs text-slate-500">
              <span className="text-sm leading-none">{t.emoji}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setDetailsOpen(true)}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-[var(--club-600)] hover:bg-[var(--club-50)] transition-colors"
        >
          Ver detalhes
        </button>
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
              <div className="w-14 h-14 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-[var(--club-600)]" strokeWidth={1.8} />
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
              <ChevronRight className="w-5 h-5 text-[var(--club-600)] shrink-0" />
            </button>
          );
        })}
      </div>

      <div aria-hidden className="h-28" />
      <BottomNav />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900" style={{ textTransform: "none" }}>
              Detalhes dos registros
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pt-3">
            <div className="rounded-full bg-slate-100 p-1 grid grid-cols-3 gap-1">
              {(["semana", "mes", "historico"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDetailsTab(t)}
                  className={cn(
                    "py-2 rounded-full text-xs font-semibold transition-colors",
                    detailsTab === t
                      ? "bg-white text-[var(--club-600)] shadow-sm"
                      : "text-slate-500"
                  )}
                >
                  {t === "semana" ? "7 dias" : t === "mes" ? "4 semanas" : "Histórico"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto">
            {detailsTab === "semana" ? (
              <div className="space-y-2">
                {details.daily.map((d) => (
                  <div
                    key={d.date}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {d.emotion ? emotionLabels[d.emotion] ?? d.emotion : "Sem registro"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-bold px-3 py-1 rounded-full shrink-0",
                        d.value !== null
                          ? "bg-[var(--club-50)] text-[var(--club-700)]"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {d.value !== null ? `${d.value}%` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : detailsTab === "mes" ? (
              <div className="space-y-2">
                {details.weekly.map((w) => (
                  <div
                    key={w.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{w.label}</p>
                      <p className="text-xs text-slate-500">
                        {w.count} registro{w.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-bold px-3 py-1 rounded-full shrink-0",
                        w.avg !== null
                          ? "bg-[var(--club-50)] text-[var(--club-700)]"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {w.avg !== null ? `${w.avg}%` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {details.history.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Nenhum check-in registrado ainda.
                  </p>
                )}
                {details.history.map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 capitalize">
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.entries.map((e: any) => {
                        const score = MOOD_SCORES[e.emotion] ?? 60;
                        const tier = [...MOOD_TIERS].sort(
                          (a, b) => Math.abs(a.value - score) - Math.abs(b.value - score)
                        )[0];
                        return (
                          <div
                            key={e.entry_date + (e.created_at ?? "")}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
                          >
                            <div className="w-10 h-10 rounded-full bg-[var(--club-50)] flex items-center justify-center text-xl shrink-0">
                              {tier.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                {format(parseISO(e.entry_date), "EEE, dd 'de' MMM", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {emotionLabels[e.emotion] ?? tier.label}
                                {e.note ? ` • ${String(e.note).slice(0, 60)}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BemEstar;