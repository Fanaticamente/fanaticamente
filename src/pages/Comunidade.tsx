import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, X, MessageCircle } from "lucide-react";
import icCampo from "@/assets/Untitled_design-17.png.asset.json";
import icRanking from "@/assets/Untitled_design-22.png.asset.json";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brazilianClubs } from "@/data/brazilianClubs";
import ClubMark from "@/components/clubs/ClubMark";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleConfig } from "@/hooks/useModuleConfig";

type Tab = "ranking" | "desafios" | "atividade";

type FanRankEntry = { id: string; name: string; avatar: string | null; points: number; rank: number; isMe?: boolean };

const formatFanName = (raw: string) => {
  const parts = (raw || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Torcedor";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
};

const avatarImgProps = {
  draggable: false as const,
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onClick: (e: React.MouseEvent) => e.preventDefault(),
  style: { pointerEvents: "none" as const, WebkitTouchCallout: "none" as const, userSelect: "none" as const },
};

const medalColor = (r: number) =>
  r === 1 ? "bg-amber-400 text-white" : r === 2 ? "bg-slate-300 text-white" : r === 3 ? "bg-orange-400 text-white" : "";

const Comunidade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rankingModule } = useModuleConfig("ranking_page");
  const cfg = (rankingModule?.config || {}) as Record<string, unknown>;
  const showBadges = cfg.show_badges !== false;
  const hiddenBadges = (cfg.hidden_badges as string[]) || [];
  const clubDisplayMode = ((cfg.club_display_mode as string) || "badge") as "badge" | "flag";

  const ClubIdentity = ({ club }: { club: { id: string; shortName?: string; name: string } }) => {
    const visible = showBadges && !hiddenBadges.includes(club.id);
    if (!visible) {
      return (
        <span className="w-7 shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-center">
          {(club.shortName || club.name.slice(0, 3)).toUpperCase()}
        </span>
      );
    }
    return (
      <div className="w-7 h-7 flex-shrink-0">
        <ClubMark clubId={club.id} mode={clubDisplayMode} />
      </div>
    );
  };
  const [tab, setTab] = useState<Tab>("ranking");
  const [showClubsFull, setShowClubsFull] = useState(false);
  const [showFansFull, setShowFansFull] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("openClubs") === "1") {
      setTab("ranking");
      setShowClubsFull(true);
      searchParams.delete("openClubs");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("openFans") === "1") {
      setTab("ranking");
      setShowFansFull(true);
      searchParams.delete("openFans");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openClubsTable = () => {
    setShowClubsFull(true);
    const dismissed = localStorage.getItem("comunidade-ranking-info-dismissed");
    if (!dismissed) setShowInfo(true);
  };
  const openFansTable = () => {
    setShowFansFull(true);
    const dismissed = localStorage.getItem("comunidade-ranking-info-dismissed");
    if (!dismissed) setShowInfo(true);
  };

  useEffect(() => {
    if (showClubsFull || showFansFull) {
      const dismissed = localStorage.getItem("comunidade-ranking-info-dismissed");
      if (!dismissed) setShowInfo(true);
    }
  }, [showClubsFull, showFansFull]);

  const { data: clubRanking = [] } = useQuery({
    queryKey: ["club-ranking"],
    queryFn: async () => {
      // Leitura ao vivo para refletir atividades imediatamente
      const { data: live, error } = await supabase.rpc("get_club_ranking");
      if (!error && live) {
        return live as { favorite_club_id: string; fans_count: number; points: number }[];
      }
      const { data } = await supabase
        .from("club_ranking_snapshot")
        .select("favorite_club_id, fans_count, points");
      return (data ?? []) as { favorite_club_id: string; fans_count: number; points: number }[];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    gcTime: 30 * 60 * 1000,
  });

  const { data: fanRankingRaw = [] } = useQuery({
    queryKey: ["fan-ranking"],
    queryFn: async () => {
      const { data: live, error: liveError } = await supabase.rpc("get_fan_ranking");
      if (!liveError && live) {
        return (live as {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          favorite_club_id: string | null;
          points: number;
        }[]).slice(0, 100);
      }
      const { data, error } = await supabase
        .from("ranking_snapshot")
        .select("user_id, full_name, avatar_url, favorite_club_id, points")
        .order("position", { ascending: true })
        .limit(100);
      if (error || !data) return [] as {
        user_id: string;
        full_name: string;
        avatar_url: string | null;
        favorite_club_id: string | null;
        points: number;
      }[];
      return data as {
        user_id: string;
        full_name: string;
        avatar_url: string | null;
        favorite_club_id: string | null;
        points: number;
      }[];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    gcTime: 30 * 60 * 1000,
  });

  const clubPoints: Record<string, number> = {};
  const { data: myAvatar } = useQuery({
    queryKey: ["my-avatar", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.avatar_url ?? null;
    },
    staleTime: 0,
  });

  clubRanking.forEach((c) => { clubPoints[c.favorite_club_id] = c.points; });

  const fanRanking: FanRankEntry[] = fanRankingRaw.slice(0, 100).map((f, i) => ({
    id: f.user_id,
    name: user?.id === f.user_id ? "Você" : formatFanName(f.full_name),
    avatar: user?.id === f.user_id ? (myAvatar ?? f.avatar_url) : f.avatar_url,
    points: f.points,
    rank: i + 1,
    isMe: user?.id === f.user_id,
  }));

  const allRankableClubs = brazilianClubs.filter(
    (c) => c.league === "serie_a" || c.league === "serie_b" || c.league === "serie_c",
  );
  const sortedClubs = [...allRankableClubs]
    .map((c) => {
      const points = clubPoints[c.id] || 0;
      return { ...c, points };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt-BR"));

  const topClubs = sortedClubs.slice(0, 4);
  const topFans = fanRanking.slice(0, 4);

  return (
    <div className="min-h-screen bg-white font-sans overscroll-none">
      <Header title="Comunidade" />

      <main className="pt-16 pb-32 px-4 max-w-2xl mx-auto overscroll-none">
        {/* Top tabs */}
        <div className="bg-white rounded-full shadow-sm p-1 flex mb-5">
        {(["ranking", "atividade", "desafios"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${
                tab === t ? "bg-[var(--club-50)] text-[var(--club-700)]" : "text-gray-500"
              }`}
            >
              {t === "ranking" ? "Ranking" : t === "desafios" ? "Desafios" : "Atividade"}
            </button>
          ))}
        </div>

        {tab === "ranking" && (
          <>
            {/* Weekly challenge banner */}
            <div
              className="relative overflow-hidden rounded-3xl p-5 mb-5"
              style={{
                background: "linear-gradient(135deg, var(--club-500) 0%, var(--club-700) 100%)",
                color: "var(--club-on)",
              }}
            >
              <div className="relative z-10 max-w-[60%]">
                <h2 className="text-2xl font-bold leading-tight normal-case" style={{ textTransform: "none" }}>
                  Desafios de Autocuidado
                </h2>
                <p className="text-sm opacity-90 mt-1">Participe e some pontos</p>
                <button className="mt-4 bg-white text-[var(--club-700)] font-semibold text-sm px-5 py-2.5 rounded-full">
                  Em breve
                </button>
              </div>
              <span
                aria-hidden
                className="absolute right-2 bottom-2 w-32 h-32 opacity-25"
                style={{
                  backgroundColor: "var(--club-on)",
                  WebkitMaskImage: `url(${icRanking.url})`,
                  maskImage: `url(${icRanking.url})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </div>

            {/* Brasileirão card */}
            <section className="bg-white rounded-3xl shadow-sm p-5 mb-5">
              <header className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-base font-bold text-gray-900 normal-case">Brasileirão da Saúde Mental</h3>
                <button onClick={openClubsTable} className="text-[var(--club-600)] text-sm font-semibold flex items-center gap-0.5">
                  Ver tabela <ChevronRight className="w-4 h-4" />
                </button>
              </header>

              <div className="flex items-center px-1 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span className="flex-1 ml-2 text-center">Clube</span>
                <span className="w-12 text-center">Pts</span>
              </div>

              <div className="divide-y divide-gray-100">
                {topClubs.map((c, i) => {
                  const pos = i + 1;
                  const highlight = pos === 1;
                  return (
                    <div key={c.id} className={`flex items-center py-3 px-1 rounded-lg ${highlight ? "bg-[color:var(--club-50)]/60" : ""}`}>
                      <span className={`w-8 text-center text-sm font-bold ${highlight ? "text-[var(--club-600)]" : "text-gray-400"}`}>{pos}</span>
                      <div className="flex-1 ml-2 flex items-center gap-3 min-w-0">
                        <ClubIdentity club={c} />
                        <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                      </div>
                      <span className={`w-12 text-center text-sm font-bold ${c.points > 0 ? "text-gray-900" : "text-gray-300"}`}>{c.points}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Fan ranking card */}
            <section className="bg-white rounded-3xl shadow-sm p-5">
              <header className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-base font-bold text-gray-900 normal-case">Ranking de Torcedores</h3>
                <button onClick={openFansTable} className="text-[var(--club-600)] text-sm font-semibold flex items-center gap-0.5">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </header>

              {topFans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Ainda sem torcedores no ranking. Some pontos e apareça aqui!
                </p>
              ) : (
              <div className="divide-y divide-gray-100">
                {topFans.map((f) => (
                  <div key={f.id} className="flex items-center py-3 px-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      medalColor(f.rank) || (f.isMe ? "text-[var(--club-600)]" : "text-gray-400")
                    }`}>
                      {f.rank}
                    </div>
                  <div className="w-9 h-9 rounded-full bg-gray-200 ml-3 flex-shrink-0 overflow-hidden select-none">
                    {f.avatar && <img src={f.avatar} alt="" className="w-full h-full object-cover" {...avatarImgProps} />}
                  </div>
                    <span className={`flex-1 ml-3 text-sm font-medium truncate ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                      {f.name}
                    </span>
                    <div className={`text-right ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                      <div className="text-sm font-bold">{f.points.toLocaleString("pt-BR")} pts</div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </section>
          </>
        )}

        {tab === "desafios" && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center text-gray-500 text-sm">
            Em breve: desafios da comunidade.
          </div>
        )}
        {tab === "atividade" && (
          <div className="space-y-3">
            <button
              onClick={() => navigate("/diario")}
              className="w-full text-left rounded-3xl bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0 overflow-hidden">
                <span
                  aria-hidden
                  className="block w-9 h-9 bg-[var(--club-600)]"
                  style={{
                    WebkitMaskImage: `url(${icCampo.url})`,
                    maskImage: `url(${icCampo.url})`,
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
                <p
                  className="font-sans font-bold text-slate-900"
                  style={{ textTransform: "none" }}
                >
                  Campo das emoções
                </p>
                <p className="text-sm text-slate-500 leading-snug mt-0.5">
                  Escale seu time e gere uma reflexão.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--club-600)] shrink-0" />
            </button>

            <button
              onClick={() => navigate("/quiz")}
              className="w-full text-left rounded-3xl bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "var(--club-50)" }}
              >
                <MessageCircle className="w-7 h-7" style={{ color: "var(--club-600)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-sans font-bold text-slate-900"
                  style={{ textTransform: "none" }}
                >
                  Resenha fanática
                </p>
                <p className="text-sm text-slate-500 leading-snug mt-0.5">
                  Cenários e escolhas do dia a dia do torcedor.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--club-600)] shrink-0" />
            </button>
          </div>
        )}
      </main>

      {/* Full clubs table overlay */}
      <Dialog open={showClubsFull} onOpenChange={setShowClubsFull}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-3xl p-0 bg-white font-sans">
          <DialogHeader className="p-5 pb-2 sticky top-0 bg-white z-10">
            <DialogTitle className="font-sans text-base font-bold text-gray-900 normal-case text-left">Brasileirão da Saúde Mental</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-6 bg-white">
            <div className="flex items-center px-1 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span className="w-8 text-center">#</span>
              <span className="flex-1 ml-2">Clube</span>
              <span className="w-12 text-center">Pts</span>
            </div>
            <div className="divide-y divide-gray-100">
              {sortedClubs.map((c, i) => (
                <div key={c.id} className="flex items-center py-3 px-1">
                  <span className="w-8 text-center text-sm font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1 ml-2 flex items-center gap-3 min-w-0">
                    <ClubIdentity club={c} />
                    <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                  </div>
                  <span className={`w-12 text-center text-sm font-bold ${c.points > 0 ? "text-gray-900" : "text-gray-300"}`}>{c.points}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="p-5 pt-2 bg-white">
            <button
              onClick={() => setShowClubsFull(false)}
              className="w-full py-3 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full fans overlay */}
      <Dialog open={showFansFull} onOpenChange={setShowFansFull}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-3xl p-0 bg-white font-sans">
          <DialogHeader className="p-5 pb-2 sticky top-0 bg-white z-10">
            <DialogTitle className="font-sans text-base font-bold text-gray-900 normal-case text-left">Ranking de Torcedores</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-6 bg-white">
            {fanRanking.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Ainda sem torcedores no ranking.
              </p>
            ) : (
            <div className="divide-y divide-gray-100">
            {fanRanking.map((f) => (
              <div key={f.id} className="flex items-center py-3 px-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  medalColor(f.rank) || (f.isMe ? "text-[var(--club-600)]" : "text-gray-400")
                }`}>
                  {f.rank}
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-200 ml-3 overflow-hidden select-none">
                  {f.avatar && <img src={f.avatar} alt="" className="w-full h-full object-cover" {...avatarImgProps} />}
                </div>
                <span className={`flex-1 ml-3 text-sm font-medium truncate ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                  {f.name}
                </span>
                <span className={`text-sm font-bold ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                  {f.points.toLocaleString("pt-BR")} pts
                </span>
              </div>
            ))}
            </div>
            )}
          </div>
          <DialogFooter className="p-5 pt-2 bg-white">
            <button
              onClick={() => setShowFansFull(false)}
              className="w-full py-3 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />

      {/* First-time ranking info */}
      {showInfo && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6"
          style={{ pointerEvents: "auto" }}
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 relative font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition"
              style={{ pointerEvents: "auto" }}
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-3 normal-case">
              Como funciona o Ranking?
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              O <strong>Brasileirão da Saúde Mental</strong> pontua os clubes com base nas ações dos seus torcedores. Cada atividade gera pontos para o clube do coração conforme abaixo:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5 text-[var(--club-600)]">•</span>
                <span><strong>Sessão de terapia</strong> concluída vale <strong>3 pontos</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5 text-[var(--club-600)]">•</span>
                <span><strong>Check-in emocional</strong> diário vale <strong>1 ponto</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5 text-[var(--club-600)]">•</span>
                <span><strong>FanatiClass</strong> — cada curso finalizado vale <strong>1 ponto</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5 text-[var(--club-600)]">•</span>
                <span><strong>Atividade</strong> concluída vale <strong>1 ponto</strong>.</span>
              </li>
            </ul>
            <button
              onClick={() => {
                localStorage.setItem("comunidade-ranking-info-dismissed", "true");
                setShowInfo(false);
              }}
              className="w-full py-3 rounded-full text-white text-sm font-semibold bg-[var(--club-600)]"
            >
              Entendi, não mostrar novamente
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Comunidade;