import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Trophy, TrendingUp, X, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getClubsByLeague } from "@/data/brazilianClubs";
import ClubMark from "@/components/clubs/ClubMark";

type Tab = "ranking" | "desafios" | "atividade";
type League = "serie_a" | "serie_b" | "serie_c";

const leagueTabs: { key: League; label: string }[] = [
  { key: "serie_a", label: "Série A" },
  { key: "serie_b", label: "Série B" },
  { key: "serie_c", label: "Série C" },
];

// Placeholder fan ranking — will be wired to real data when available
const fanRanking = [
  { id: "1", name: "Lucas Alvinegro", points: 2450, rank: 1 },
  { id: "2", name: "Mariana Tricolor", points: 2150, rank: 2 },
  { id: "3", name: "Rafael Colorado", points: 1980, rank: 3 },
  { id: "me", name: "Você", points: 1650, rank: 4, isMe: true, trend: 2 },
  { id: "5", name: "Camila Palestrina", points: 1420, rank: 5 },
];

const medalColor = (r: number) =>
  r === 1 ? "bg-amber-400 text-white" : r === 2 ? "bg-slate-300 text-white" : r === 3 ? "bg-orange-400 text-white" : "";

const Comunidade = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("ranking");
  const [league, setLeague] = useState<League>("serie_a");
  const [showClubsFull, setShowClubsFull] = useState(false);
  const [showFansFull, setShowFansFull] = useState(false);

  const { data: clubCounts = {} } = useQuery({
    queryKey: ["ranking-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ranking_counts");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { club_id: string; session_count: number }) => {
        counts[row.club_id] = row.session_count;
      });
      return counts;
    },
    staleTime: 60_000,
  });

  const leagueClubs = getClubsByLeague(league);
  const sortedClubs = [...leagueClubs]
    .map((c) => {
      const sessions = clubCounts[c.id] || 0;
      return { ...c, sessions, points: sessions * 3 };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt-BR"));

  const topClubs = sortedClubs.slice(0, 4);
  const topFans = fanRanking.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans">
      <Header title="Comunidade" />

      <main className="pt-16 pb-32 px-4 max-w-2xl mx-auto">
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
            <div className="relative overflow-hidden rounded-3xl p-5 mb-5 text-white" style={{ background: "linear-gradient(135deg, #1f6b3a 0%, #14532d 100%)" }}>
              <div className="relative z-10 max-w-[60%]">
                <p className="text-sm/tight opacity-90 font-medium">Em breve</p>
                <h2 className="text-2xl font-bold leading-tight mt-1">DESAFIOS DE AUTOCUIDADO</h2>
                <p className="text-sm opacity-90 mt-1">Participe e some pontos</p>
                <button className="mt-4 bg-white text-[var(--club-700)] font-semibold text-sm px-5 py-2.5 rounded-full">
                  Em breve
                </button>
              </div>
              <Trophy className="absolute right-2 bottom-2 w-32 h-32 text-white/25" strokeWidth={1.2} />
            </div>

            {/* Brasileirão card */}
            <section className="bg-white rounded-3xl shadow-sm p-5 mb-5">
              <header className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-lg font-bold text-gray-900 normal-case">Brasileirão da Saúde Mental</h3>
                <button onClick={() => setShowClubsFull(true)} className="text-[var(--club-600)] text-sm font-semibold flex items-center gap-0.5">
                  Ver tabela <ChevronRight className="w-4 h-4" />
                </button>
              </header>

              <div className="flex gap-2 mb-4">
                {leagueTabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setLeague(t.key)}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-colors ${
                      league === t.key ? "bg-[var(--club-600)] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center px-1 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span className="flex-1 ml-2 text-center">Clube</span>
                <span className="w-12 text-center">Pts</span>
                <span className="w-16 text-center">Sessões</span>
              </div>

              <div className="divide-y divide-gray-100">
                {topClubs.map((c, i) => {
                  const pos = i + 1;
                  const highlight = pos === 1;
                  return (
                    <div key={c.id} className={`flex items-center py-3 px-1 rounded-lg ${highlight ? "bg-[color:var(--club-50)]/60" : ""}`}>
                      <span className={`w-8 text-center text-sm font-bold ${highlight ? "text-[var(--club-600)]" : "text-gray-400"}`}>{pos}</span>
                      <div className="flex-1 ml-2 flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 flex-shrink-0"><ClubMark clubId={c.id} mode="badge" /></div>
                        <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                      </div>
                      <span className={`w-12 text-center text-sm font-bold ${c.points > 0 ? "text-gray-900" : "text-gray-300"}`}>{c.points}</span>
                      <span className={`w-16 text-center text-sm ${c.sessions > 0 ? "text-gray-700" : "text-gray-300"}`}>{c.sessions}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Fan ranking card */}
            <section className="bg-white rounded-3xl shadow-sm p-5">
              <header className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-lg font-bold text-gray-900 normal-case">Ranking de Torcedores</h3>
                <button onClick={() => setShowFansFull(true)} className="text-[var(--club-600)] text-sm font-semibold flex items-center gap-0.5">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </header>

              <div className="divide-y divide-gray-100">
                {topFans.map((f) => (
                  <div key={f.id} className="flex items-center py-3 px-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      medalColor(f.rank) || (f.isMe ? "text-[var(--club-600)]" : "text-gray-400")
                    }`}>
                      {f.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gray-200 ml-3 flex-shrink-0 overflow-hidden" />
                    <span className={`flex-1 ml-3 text-sm font-medium truncate ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                      {f.name}
                    </span>
                    <div className={`text-right ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                      <div className="text-sm font-bold">{f.points.toLocaleString("pt-BR")} pts</div>
                      {f.isMe && f.trend ? (
                        <div className="text-[11px] flex items-center justify-end gap-0.5">
                          <TrendingUp className="w-3 h-3" /> {f.trend}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="w-14 h-14 rounded-2xl bg-[var(--club-50)] flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-[var(--club-600)]" strokeWidth={1.8} />
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
          </div>
        )}
      </main>

      {/* Full clubs table overlay */}
      <Dialog open={showClubsFull} onOpenChange={setShowClubsFull}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-3xl p-0 bg-white font-sans">
          <DialogHeader className="p-5 pb-2 sticky top-0 bg-white z-10">
            <DialogTitle className="font-sans text-lg font-bold text-gray-900 normal-case text-left">Brasileirão da Saúde Mental</DialogTitle>
            <div className="flex gap-2 mt-3">
              {leagueTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setLeague(t.key)}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold ${
                    league === t.key ? "bg-[var(--club-600)] text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </DialogHeader>
          <div className="px-5 pb-6 bg-white">
            <div className="flex items-center px-1 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span className="w-8 text-center">#</span>
              <span className="flex-1 ml-2">Clube</span>
              <span className="w-12 text-center">Pts</span>
              <span className="w-16 text-center">Sessões</span>
            </div>
            <div className="divide-y divide-gray-100">
              {sortedClubs.map((c, i) => (
                <div key={c.id} className="flex items-center py-3 px-1">
                  <span className="w-8 text-center text-sm font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1 ml-2 flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex-shrink-0"><ClubMark clubId={c.id} mode="badge" /></div>
                    <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                  </div>
                  <span className={`w-12 text-center text-sm font-bold ${c.points > 0 ? "text-gray-900" : "text-gray-300"}`}>{c.points}</span>
                  <span className={`w-16 text-center text-sm ${c.sessions > 0 ? "text-gray-700" : "text-gray-300"}`}>{c.sessions}</span>
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
            <DialogTitle className="font-sans text-lg font-bold text-gray-900 normal-case text-left">Ranking de Torcedores</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-6 divide-y divide-gray-100 bg-white">
            {fanRanking.map((f) => (
              <div key={f.id} className="flex items-center py-3 px-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  medalColor(f.rank) || (f.isMe ? "text-[var(--club-600)]" : "text-gray-400")
                }`}>
                  {f.rank}
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-200 ml-3" />
                <span className={`flex-1 ml-3 text-sm font-medium truncate ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                  {f.name}
                </span>
                <span className={`text-sm font-bold ${f.isMe ? "text-[var(--club-600)]" : "text-gray-800"}`}>
                  {f.points.toLocaleString("pt-BR")} pts
                </span>
              </div>
            ))}
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
    </div>
  );
};

export default Comunidade;