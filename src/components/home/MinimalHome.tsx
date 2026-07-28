import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { CalendarDays, Users, GraduationCap, Play, TrendingUp, ChevronRight, HeartPulse, Heart } from "lucide-react";
import jornadaLogo from "@/assets/logo-header-v3.png.asset.json";
import icCampo from "@/assets/Untitled_design-17.png.asset.json";
import icCurso from "@/assets/Untitled_design-18.png.asset.json";
import icEspecialista from "@/assets/Untitled_design-23.png.asset.json";
import icTorcida from "@/assets/Untitled_design-24.png.asset.json";
import icRadio from "@/assets/ic-radio-v2.png.asset.json";
import icNoticias from "@/assets/Untitled_design-21.png.asset.json";
import icRanking from "@/assets/Untitled_design-22.png.asset.json";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import NextMatchBar from "@/components/home/NextMatchBar";
import { useAppModules } from "@/hooks/useAppModules";
import { getMenuIcon } from "@/lib/menuIcons";

type HomeCfg = Record<string, unknown>;
type SuggestionItem = { image?: string; kicker?: string; title?: string; subtitle?: string; path?: string };
type ShortcutItem = { icon?: string; label?: string; path?: string };
const MOODS: { id: string; emoji: string; label: string }[] = [
  { id: "muito_bem", emoji: "😄", label: "Muito bem" },
  { id: "mais_ou_menos", emoji: "🙂", label: "Mais ou menos" },
  { id: "nao_legal", emoji: "😐", label: "Não estou legal" },
  { id: "ansioso", emoji: "😟", label: "Ansioso" },
  { id: "irritado", emoji: "😠", label: "Irritado" },
];

const REASON_GROUPS_BASE: { title: string; items: string[] }[] = [
  { title: "Carreira e Estudos", items: ["Carreira e Estudos", "Produtividade", "Relações profissionais", "Salário"] },
  { title: "Emocional", items: ["Controle emocional", "Medos e fobias", "Mudanças", "Traumas"] },
  { title: "Família e Amigos", items: ["Amigos", "Familiares", "Filhos", "Pais"] },
  { title: "Finanças", items: ["Minhas finanças"] },
  {
    title: "Saúde e Bem Estar",
    items: [
      "Alimentação",
      "Corpo",
      "Doente",
      "Dor física",
      "Estudos",
      "Exercícios físicos / Esportes",
      "Hábitos",
      "Meditação",
      "Sono",
      "Vícios",
    ],
  },
  { title: "Vida Amorosa", items: ["Orientação sexual", "Relacionamento amoroso", "Sexo"] },
];

const GOOD_MOODS = ["muito_bem"];

const MOOD_SCORES: Record<string, number> = {
  muito_bem: 100,
  mais_ou_menos: 75,
  nao_legal: 50,
  ansioso: 25,
  irritado: 0,
  otimo: 100,
  bem: 75,
  neutro: 50,
  mal: 0,
};

const getReasonGroups = (moodId: string | null) => {
  const isGood = moodId ? GOOD_MOODS.includes(moodId) : false;
  const meuClubeItems = isGood
    ? ["Vitória", "Goleada aplicada", "Vitória no clássico", "Classificação", "Título", "Derrota do rival"]
    : [
        "Derrotas",
        "Empate",
        "Goleada sofrida",
        "Derrota no clássico",
        "Desclassificação",
        "Perda de título",
        "Vitória do rival",
      ];
  return [{ title: "Meu Clube", items: meuClubeItems }, ...REASON_GROUPS_BASE];
};

const SUGGESTIONS = [
  {
    img: icCampo.url,
    kicker: "Sugestão para você",
    title: "Campo das emoções",
    subtitle: "Escale seu time e gere uma reflexão",
    path: "/diario",
  },
  {
    img: icCurso.url,
    kicker: "Curso em destaque",
    title: ["Ética & Responsabilidade Social", "no Futebol"],
    subtitle: "Comece agora mesmo",
    path: "/curso/c6c7600e-de31-4adc-935e-75a9dd30beba",
    small: true,
  },
  {
    img: icEspecialista.url,
    kicker: "Cuide de você",
    title: "Converse com um(a) especialista",
    subtitle: "Terapeutas disponíveis",
    path: "/terapeutas",
    small: true,
  },
  {
    img: icRadio.url,
    kicker: "Ao vivo",
    title: "Alambrado FM",
    subtitle: "Acompanhe as rádios esportivas",
    path: "/radio",
  },
  {
    img: icNoticias.url,
    kicker: "Fique por dentro",
    title: "Conteúdos sobre Futebol & Saúde",
    subtitle: "Últimas atualizações",
    path: "/futebol",
  },
  {
    img: icRanking.url,
    kicker: "Comunidade",
    title: "Brasileirão da Saúde Mental",
    subtitle: "Veja como estão os clubes e torcida",
    path: "/comunidade?openClubs=1",
    small: true,
  },
];

const MinimalHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: homeModules } = useAppModules("home");
  const findModule = (id: string) => homeModules?.find((m) => m.module_id === id);
  const isOn = (id: string) => {
    const m = findModule(id);
    return m ? m.is_visible : true;
  };
  const cfgOf = (id: string): HomeCfg => {
    const c = findModule(id)?.config;
    return c && typeof c === "object" ? (c as HomeCfg) : {};
  };

  const suggestionsCfg = (cfgOf("home_suggestions").items as SuggestionItem[] | undefined) || [];
  const suggestions = suggestionsCfg.length
    ? suggestionsCfg.map((item) => {
        const fallback = SUGGESTIONS.find((s) => s.path === item.path);
        return {
          img: item.image || fallback?.img || icEspecialista.url,
          kicker: item.kicker ?? "",
          title: item.title ?? "",
          subtitle: item.subtitle ?? "",
          path: item.path || "/",
        };
      })
    : SUGGESTIONS.map((s) => ({
        img: s.img,
        kicker: s.kicker,
        title: Array.isArray(s.title) ? s.title.join(" ") : s.title,
        subtitle: s.subtitle,
        path: s.path,
      }));
  const suggestionsCount = suggestions.length;
  const [selected, setSelected] = useState<string | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [sugIdx, setSugIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDX = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setSugIdx((i) => (i + 1) % Math.max(suggestionsCount, 1));
    }, 4500);
    return () => clearInterval(t);
  }, [suggestionsCount]);

  useEffect(() => {
    if (!reasonOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const rootEl = document.getElementById("root");
    const prevHtml = root.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    const prevRoot = rootEl?.style.backgroundColor ?? "";

    const clubColor = getComputedStyle(root).getPropertyValue("--club-600").trim();
    root.style.backgroundColor = clubColor || "#237B0E";
    body.style.backgroundColor = clubColor || "#237B0E";
    if (rootEl) rootEl.style.backgroundColor = clubColor || "#237B0E";

    return () => {
      root.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
      if (rootEl) rootEl.style.backgroundColor = prevRoot;
    };
  }, [reasonOpen]);

  const { data: profile } = useQuery({
    queryKey: ["mh-profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).maybeSingle();
      if (data?.full_name) {
        try {
          localStorage.setItem("mh:firstName", data.full_name.split(" ")[0]);
        } catch {}
      }
      return data;
    },
  });

  const cachedFirstName = (() => {
    try {
      return localStorage.getItem("mh:firstName") || "";
    } catch {
      return "";
    }
  })();
  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : cachedFirstName;
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
        .select("entry_date, emotion")
        .eq("user_id", user!.id)
        .gte("entry_date", since);
      return data ?? [];
    },
  });

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayEntry = emotions.find((e: any) => e.entry_date === todayKey) as
    | { entry_date: string; emotion: string }
    | undefined;

  const miniSeries = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      const entry = emotions.find((e: any) => e.entry_date === key) as any;
      return {
        key,
        label: format(d, "EEEEEE", { locale: ptBR }),
        value: entry ? (MOOD_SCORES[entry.emotion] ?? 50) : null,
      };
    });
  }, [emotions]);

  const weekActivities = useMemo(
    () => emotions.filter((e) => differenceInCalendarDays(new Date(), new Date(e.entry_date)) < 7).length,
    [emotions],
  );
  const progressPct = Math.min(100, Math.round((weekActivities / 10) * 100));

  const checkinMutation = useMutation({
    mutationFn: async ({ moodId, note }: { moodId: string; note: string }) => {
      if (!user) throw new Error("no-user");
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("emotion_entries")
        .upsert(
          { user_id: user.id, emotion: moodId, note: note || null, entry_date: today },
          { onConflict: "user_id,entry_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-in registrado! 💚");
      qc.invalidateQueries({ queryKey: ["mh-emotions"] });
      setSelected(null);
      setReasons([]);
      setReasonOpen(false);
    },
    onError: () => toast.error("Não foi possível registrar."),
  });

  const shortcutsCfg = (cfgOf("home_shortcuts").items as ShortcutItem[] | undefined) || [];
  const shortcuts = (
    shortcutsCfg.length
      ? shortcutsCfg
      : [
          { icon: "CalendarDays", label: "Consultas", path: "/meus-agendamentos" },
          { icon: "Users", label: "Terapeutas", path: "/terapeutas" },
          { icon: "GraduationCap", label: "Cursos", path: "/cursos" },
          { icon: "Heart", label: "Bem-estar", path: "/bem-estar" },
        ]
  ).map((s) => ({ icon: getMenuIcon(s.icon), label: s.label ?? "", path: s.path || "/" }));

  const greetingCfg = cfgOf("home_greeting");
  const checkinCfg = cfgOf("home_checkin");
  const journeyCfg = cfgOf("home_journey");
  const fanbaseCfg = cfgOf("home_fanbase");

  return (
    <div className="font-sans text-slate-900 space-y-5 pb-4">
      {/* Greeting */}
      <section className="pt-[1cm]">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight leading-none normal-case flex items-center gap-1 whitespace-nowrap min-h-[1.5rem]">
          {firstName ? (
            <>
              {greeting}, <span className="text-[var(--club-600)]">{firstName}!</span>{" "}
              <span className="inline-block">👋</span>
            </>
          ) : (
            <span className="opacity-0">{greeting}</span>
          )}
        </h1>
        <p className="mt-1.5 text-slate-500 text-[15px] leading-snug">
          {(greetingCfg.subtitle as string) || "Saúde Mental agora é papo de arquibancada!"}
        </p>
      </section>

      {/* Próxima partida do clube do coração */}
      {isOn("home_next_match") && (
        <div className="mt-[1cm]">
          <NextMatchBar />
        </div>
      )}

      {/* Check-in */}
      {isOn("home_checkin") && (
        <section className="mt-[19px] rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
          {todayEntry ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--club-600)] text-xs font-semibold">
                  <HeartPulse className="w-4 h-4" />
                  Check-in de hoje registrado
                </div>
                <button
                  onClick={() => navigate("/bem-estar")}
                  className="flex items-center gap-0.5 text-xs font-semibold text-[var(--club-600)]"
                >
                  Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl leading-none" aria-hidden>
                  {MOODS.find((m) => m.id === todayEntry.emotion)?.emoji ?? "🙂"}
                </span>
                <div>
                  <h2 className="font-sans text-lg font-bold normal-case leading-tight">
                    {MOODS.find((m) => m.id === todayEntry.emotion)?.label ?? "Registrado"}
                  </h2>
                  <p className="text-xs text-slate-500">Volte amanhã para uma nova rodada </p>
                </div>
              </div>
              <div className="mt-3 h-[90px] text-[var(--club-600)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniSeries} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <YAxis hide domain={[0, 100]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "currentColor", strokeWidth: 0 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-7 text-[10px] text-slate-400 text-center">
                {miniSeries.map((d) => (
                  <span key={d.key} className="capitalize">
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[var(--club-600)] text-xs font-semibold">
                <HeartPulse className="w-4 h-4" />
                {(checkinCfg.kicker as string) || "Check-in emocional"}
              </div>
              <h2 className="font-sans mt-1.5 text-xl font-bold normal-case">
                {(checkinCfg.title as string) || "Como você está hoje?"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {(checkinCfg.subtitle as string) || "Cada dia é uma rodada!"}
              </p>

              <div className="grid grid-cols-5 gap-2 mt-4">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelected(m.id);
                      setReasons([]);
                      setReasonOpen(true);
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-[var(--club-100)] text-2xl",
                        selected === m.id ? "ring-2 ring-[var(--club-400)] scale-105" : "opacity-90",
                      )}
                    >
                      <span aria-hidden>{m.emoji}</span>
                    </div>
                    <span className="text-[10.5px] font-semibold text-slate-700 leading-tight text-center">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {reasonOpen &&
        selected &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col text-white bg-[var(--club-600)] overflow-hidden"
            style={{ height: "100dvh", width: "100vw", top: 0, left: 0 }}
          >
            <div
              className="flex items-center gap-3 px-4 pb-3 bg-[var(--club-600)]"
              style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
            >
              <button
                aria-label="Voltar"
                onClick={() => {
                  setReasonOpen(false);
                  setSelected(null);
                  setReasons([]);
                }}
                className="w-10 h-10 flex items-center justify-center -ml-2"
              >
                <ChevronRight className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h2 className="font-sans text-lg font-bold normal-case flex-1">De onde vem este sentimento?</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
              {getReasonGroups(selected).map((g) => (
                <div key={g.title} className="mt-4 first:mt-0">
                  <h3 className="text-center font-sans font-bold text-white/85 normal-case mb-3">{g.title}</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {g.items.map((r) => {
                      const active = reasons.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() =>
                            setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
                          }
                          className={cn(
                            "px-4 py-2 rounded-full border text-sm font-medium transition",
                            active
                              ? "bg-white text-[var(--club-700)] border-white"
                              : "border-white/80 text-white hover:bg-white/10",
                          )}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {reasons.length > 0 && (
              <div
                className="absolute inset-x-0 bottom-0 px-4 pt-3 bg-gradient-to-t from-[var(--club-700)] to-transparent"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              >
                <button
                  disabled={checkinMutation.isPending}
                  onClick={() => checkinMutation.mutate({ moodId: selected, note: reasons.join(", ") })}
                  className="w-full py-3.5 rounded-2xl bg-white text-[var(--club-700)] font-bold text-sm transition disabled:opacity-60"
                >
                  {checkinMutation.isPending ? "Registrando…" : "Confirmar"}
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}

      {/* Sugestões carrossel */}
      {isOn("home_suggestions") && suggestionsCount > 0 && (
        <section>
          <div
            className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/70 shadow-sm"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchDX.current = 0;
              pausedRef.current = true;
            }}
            onTouchMove={(e) => {
              if (touchStartX.current == null) return;
              touchDX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              const dx = touchDX.current;
              if (Math.abs(dx) > 40) {
                setSugIdx((i) => (dx < 0 ? (i + 1) % suggestionsCount : (i - 1 + suggestionsCount) % suggestionsCount));
              }
              touchStartX.current = null;
              touchDX.current = 0;
              setTimeout(() => {
                pausedRef.current = false;
              }, 4000);
            }}
            style={{ touchAction: "pan-y" }}
          >
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${sugIdx * 100}%)` }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.path + s.title}
                  onClick={() => navigate(s.path)}
                  className="w-full shrink-0 text-left p-3.5 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0 overflow-hidden">
                    <span
                      aria-hidden
                      className="block w-8 h-8 bg-[var(--club-600)]"
                      style={{
                        WebkitMaskImage: `url(${s.img})`,
                        maskImage: `url(${s.img})`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] font-semibold text-[var(--club-600)] truncate">{s.kicker}</p>
                    <p
                      className={cn(
                        "font-bold text-slate-900 leading-tight break-words",
                        (s.title?.length ?? 0) > 30 ? "text-[13px]" : "text-[14px]",
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-[11.5px] text-slate-500 truncate">{s.subtitle}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-[var(--club-600)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {suggestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setSugIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === sugIdx ? "w-5 bg-[var(--club-500)]" : "w-1.5 bg-slate-300",
                )}
                aria-label={`Ir para sugestão ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Acesso rápido */}
      {isOn("home_shortcuts") && (
        <section>
          <h3 className="font-sans font-bold text-slate-900 mb-2 px-1 normal-case tracking-normal">
            {(cfgOf("home_shortcuts").title as string) || "Acesso rápido"}
          </h3>
          <div className="grid grid-cols-4 gap-2.5">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.path}
                  onClick={() => navigate(s.path)}
                  className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-3 flex flex-col items-center gap-2 aspect-square justify-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--club-50)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--club-600)]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Sua jornada */}
      {isOn("home_journey") && (
        <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--club-600)]" />
                <h3 className="font-sans font-bold normal-case tracking-normal">
                  {(journeyCfg.title as string) || "Sua jornada"}
                </h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Você completou {weekActivities} atividade{weekActivities === 1 ? "" : "s"} esta semana.
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[var(--club-500)] rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--club-600)]">{progressPct}%</span>
              </div>

              <button
                onClick={() => navigate("/minha-temporada")}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--club-600)]"
              >
                Ver evolução detalhada <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0">
              <img src={jornadaLogo.url} alt="" className="w-12 h-12 object-contain" />
            </div>
          </div>
        </section>
      )}

      {/* Torcida */}
      {isOn("home_fanbase") && (
        <button
          onClick={() => navigate((fanbaseCfg.link as string) || "/comunidade?openFans=1")}
          className="w-full text-left rounded-3xl bg-[var(--club-50)] border border-[var(--club-100)] p-4 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <span
              aria-hidden
              className="block w-10 h-10 bg-[var(--club-600)]"
              style={{
                WebkitMaskImage: `url(${icTorcida.url})`,
                maskImage: `url(${icTorcida.url})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-[13px] leading-tight truncate">
              {(fanbaseCfg.title as string) || "Juntos na arquibancada e na evolução!"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {(fanbaseCfg.subtitle as string) || "Veja os torcedores que estão cuidando da mente."}
            </p>
            <p className="text-sm font-semibold text-[var(--club-700)] mt-1 inline-flex items-center gap-1">
              {(fanbaseCfg.cta as string) || "Ver ranking"} <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </button>
      )}
    </div>
  );
};

export default MinimalHome;
