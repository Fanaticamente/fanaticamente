import { Loader2, RefreshCw, MapPin, Clock } from "lucide-react";
import { useBrasileirao } from "@/hooks/useBrasileirao";
import ClubMark from "@/components/clubs/ClubMark";
import { findClubId, cleanDisplayName } from "@/lib/clubMatcher";

const zoneColor = (pos: number): string => {
  if (pos <= 4) return "bg-emerald-500"; // Libertadores
  if (pos <= 6) return "bg-blue-500"; // Pré-Libertadores
  if (pos <= 12) return "bg-amber-400"; // Sul-Americana
  if (pos >= 17) return "bg-red-500"; // Rebaixamento
  return "bg-gray-300";
};

const BrasileiraoTable = () => {
  const { data, isLoading, isError, refetch, isFetching } = useBrasileirao(true);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--club-600)" }} />
        <p className="text-gray-500 text-sm">Carregando tabela do Brasileirão...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-gray-600 text-sm mb-4">Não foi possível carregar a tabela agora.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--club-600)" }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const updated = new Date(data.updated_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="px-4 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">Brasileirão Série A</h2>
          <p className="text-[11px] text-gray-500">Atualizado {updated} • Fonte: SofaScore/Opta (via Fotmob)</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 disabled:opacity-50"
          aria-label="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Standings table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px] gap-1 px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          <span>#</span>
          <span>Time</span>
          <span className="text-center">P</span>
          <span className="text-center">J</span>
          <span className="text-center">V</span>
          <span className="text-center">SG</span>
          <span className="text-center">Pts</span>
        </div>
        <div className="divide-y divide-gray-100">
          {data.standings.map((row) => {
            const clubId = findClubId(row.club, row.abbr);
            const displayName = cleanDisplayName(row.club);
            return (
              <div
                key={`${row.position}-${row.abbr}`}
                className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px] gap-1 items-center px-3 py-2 text-[13px] text-gray-800"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1 h-4 rounded-sm ${zoneColor(row.position)}`} />
                  <span className="text-gray-500 font-semibold">{row.position}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {clubId ? (
                    <div className="w-5 h-5 shrink-0">
                      <ClubMark clubId={clubId} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 shrink-0 rounded-full bg-gray-200" />
                  )}
                  <span className="truncate font-medium">{displayName}</span>
                </div>
                <span className="text-center text-gray-500">{row.played}</span>
                <span className="text-center text-gray-500">{row.played}</span>
                <span className="text-center text-gray-500">{row.wins}</span>
                <span className="text-center text-gray-500">{row.goal_diff}</span>
                <span className="text-center font-bold text-gray-900">{row.points}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-gray-50 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Libertadores</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" />Pré-Liberta.</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />Sul-Americana</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" />Rebaixamento</span>
        </div>
      </div>

      {/* Next round */}
      {data.next_round.length > 0 && (
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">Próxima rodada</h3>
          <div className="space-y-2">
            {data.next_round.map((m, i) => {
              const homeId = findClubId(m.home, m.home_abbr);
              const awayId = findClubId(m.away, m.away_abbr);
              const homeName = cleanDisplayName(m.home);
              const awayName = cleanDisplayName(m.away);
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.date}
                      {m.weekday ? ` • ${m.weekday}` : ""}
                      {m.time ? ` • ${m.time}` : ""}
                    </span>
                    {m.venue && (
                      <span className="flex items-center gap-1 truncate max-w-[45%]">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{m.venue}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {homeId && (
                        <div className="w-6 h-6 shrink-0"><ClubMark clubId={homeId} /></div>
                      )}
                      <span className="text-sm font-semibold text-gray-800 truncate">{homeName}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 px-2">×</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-gray-800 truncate text-right">{awayName}</span>
                      {awayId && (
                        <div className="w-6 h-6 shrink-0"><ClubMark clubId={awayId} /></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrasileiraoTable;