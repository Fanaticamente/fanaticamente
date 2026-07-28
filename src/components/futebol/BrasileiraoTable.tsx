import { createContext, useContext, useState } from "react";
import { Loader2, RefreshCw, MapPin, Clock, ChevronDown } from "lucide-react";
import { useLeague, LEAGUE_LABELS, type LeagueKey, type BrasileiraoPayload } from "@/hooks/useBrasileirao";
import TeamBadge from "@/components/clubs/TeamBadge";
import ClubMark, { type ClubDisplayMode } from "@/components/clubs/ClubMark";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { findClubId, cleanDisplayName } from "@/lib/clubMatcher";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------------
// Club identity (respects manager toggles: shields / flags / abbreviation)
// ------------------------------------------------------------------------
interface BadgeSettings {
  showBadges: boolean;
  mode: ClubDisplayMode;
  hidden: string[];
}

const BadgeCtx = createContext<BadgeSettings>({ showBadges: true, mode: "badge", hidden: [] });

const ClubIdentity = ({
  clubId, fotmobId, name, abbr, size = "w-5 h-5",
}: { clubId: string | null; fotmobId?: number | string; name: string; abbr?: string; size?: string }) => {
  const { showBadges, mode, hidden } = useContext(BadgeCtx);
  const hiddenForClub = clubId ? hidden.includes(clubId) : false;

  const fallback = (
    <span className={`${size} shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase`}>
      {(abbr || name.slice(0, 3)).toUpperCase().slice(0, 3)}
    </span>
  );

  if (!showBadges || hiddenForClub) return fallback;

  if (mode === "flag") {
    if (!clubId) return fallback;
    return (
      <div className={`${size} shrink-0`}>
        <ClubMark clubId={clubId} mode="flag" />
      </div>
    );
  }

  return (
    <div className={`${size} shrink-0`}>
      <TeamBadge clubId={clubId} fotmobId={fotmobId as any} alt={name} />
    </div>
  );
};

const zoneColor = (pos: number): string => {
  if (pos <= 4) return "bg-emerald-500"; // Libertadores
  if (pos <= 6) return "bg-blue-500"; // Pré-Libertadores
  if (pos <= 12) return "bg-amber-400"; // Sul-Americana
  if (pos >= 17) return "bg-red-500"; // Rebaixamento
  return "bg-gray-300";
};

// ------------------------------------------------------------------------
// Inner renderers
// ------------------------------------------------------------------------

const StandingsGrid = ({ data }: { data: BrasileiraoPayload }) => {
  if (!data.standings?.length) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-gray-500">
        Tabela não disponível para esta competição.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="grid grid-cols-[28px_1fr_40px_32px_32px_32px] gap-1 px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          <span>#</span>
          <span>Time</span>
          <span className="text-center">Pts</span>
          <span className="text-center">J</span>
          <span className="text-center">V</span>
          <span className="text-center">SG</span>
        </div>
        <div className="divide-y divide-gray-100">
          {data.standings.map((row) => {
            const clubId = findClubId(row.club, row.abbr);
            const displayName = cleanDisplayName(row.club);
            return (
              <div
                key={`${row.position}-${row.abbr}`}
                className="grid grid-cols-[28px_1fr_40px_32px_32px_32px] gap-1 items-center px-3 py-2 text-[13px] text-gray-800"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1 h-4 rounded-sm ${zoneColor(row.position)}`} />
                  <span className="text-gray-500 font-semibold">{row.position}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <ClubIdentity clubId={clubId} fotmobId={row.team_id} name={displayName} abbr={row.abbr} />
                  <span className="truncate font-medium">{displayName}</span>
                </div>
                <span className="text-center font-bold text-gray-900">{row.points}</span>
                <span className="text-center text-gray-500">{row.played}</span>
                <span className="text-center text-gray-500">{row.wins}</span>
                <span className="text-center text-gray-500">{row.goal_diff}</span>
              </div>
            );
          })}
        </div>
    </div>
  );
};

const NextRoundList = ({ data }: { data: BrasileiraoPayload }) => {
  if (!data.next_round?.length) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-gray-500">
        Sem jogos programados no momento.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {data.next_round.map((m, i) => {
              const homeId = findClubId(m.home, m.home_abbr);
              const awayId = findClubId(m.away, m.away_abbr);
              const homeName = cleanDisplayName(m.home);
              const awayName = cleanDisplayName(m.away);
              return (
                <div
                  key={i}
            className="rounded-xl border border-gray-200 bg-white p-3"
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
                      <ClubIdentity clubId={homeId} fotmobId={m.home_id} name={homeName} abbr={m.home_abbr} size="w-6 h-6" />
                      <span className="text-sm font-semibold text-gray-800 truncate">{homeName}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 px-2">×</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-gray-800 truncate text-right">{awayName}</span>
                      <ClubIdentity clubId={awayId} fotmobId={m.away_id} name={awayName} abbr={m.away_abbr} size="w-6 h-6" />
                    </div>
                  </div>
                </div>
              );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------
// League card (expandable)
// ------------------------------------------------------------------------

interface LeagueCardProps {
  leagueKey: LeagueKey;
  defaultOpen?: boolean;
  showStandingsToggle?: boolean; // false → cup: only "Jogos"
}

const LeagueCard = ({ leagueKey, defaultOpen = false, showStandingsToggle = true }: LeagueCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<"standings" | "matches">(showStandingsToggle ? "standings" : "matches");
  const { data, isLoading, isError, refetch, isFetching } = useLeague(leagueKey, open);
  const label = LEAGUE_LABELS[leagueKey];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-gray-900 truncate">{label}</h3>
          {data?.updated_at && (
            <p className="text-[10px] text-gray-500">
              Atualizado{" "}
              {new Date(data.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {/* Preview (top 4) when collapsed */}
      {!open && data?.standings?.length ? (
        <div className="px-4 pb-3 space-y-1">
          {data.standings.slice(0, 4).map((row) => {
            const clubId = findClubId(row.club, row.abbr);
            return (
              <div key={row.position} className="flex items-center gap-2 text-[12px] text-gray-700">
                <span className={`w-1 h-3 rounded-sm ${zoneColor(row.position)}`} />
                <span className="text-gray-500 font-semibold w-4">{row.position}</span>
                <ClubIdentity clubId={clubId} fotmobId={row.team_id} name={cleanDisplayName(row.club)} abbr={row.abbr} size="w-4 h-4" />
                <span className="truncate flex-1">{cleanDisplayName(row.club)}</span>
                <span className="font-bold">{row.points}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2">
            {showStandingsToggle ? (
              <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-[11px] font-semibold">
                <button
                  onClick={() => setTab("standings")}
                  className={cn(
                    "px-3 py-1 rounded-full transition-colors",
                    tab === "standings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500",
                  )}
                >
                  Tabela
                </button>
                <button
                  onClick={() => setTab("matches")}
                  className={cn(
                    "px-3 py-1 rounded-full transition-colors",
                    tab === "matches" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500",
                  )}
                >
                  Jogos
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-semibold text-gray-500">Próximos jogos</span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 disabled:opacity-50"
              aria-label="Atualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : isError && !data ? (
            <div className="text-center text-[12px] text-gray-500 py-6">
              Não foi possível carregar {label}.
            </div>
          ) : data ? (
            tab === "standings" && showStandingsToggle ? (
              <StandingsGrid data={data} />
            ) : (
              <NextRoundList data={data} />
            )
          ) : null}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------------
// Root: multi-league accordion
// ------------------------------------------------------------------------

const CUP_LEAGUES: LeagueKey[] = ["copa-do-brasil", "libertadores", "sul-americana"];

const DEFAULT_LEAGUES: { key: LeagueKey; visible?: boolean }[] = [
  { key: "serie-a" },
  { key: "serie-b" },
  { key: "serie-c" },
  { key: "copa-do-brasil" },
  { key: "libertadores" },
  { key: "sul-americana" },
];

const BrasileiraoTable = () => {
  const { data: mod } = useModuleConfig("football_table");
  const cfg = (mod?.config as any) || {};

  const settings: BadgeSettings = {
    showBadges: cfg.show_badges !== false,
    mode: (cfg.club_display_mode as ClubDisplayMode) || "badge",
    hidden: (cfg.hidden_badges as string[]) || [],
  };

  const leagues: { key: LeagueKey; visible?: boolean }[] =
    (cfg.leagues as any[])?.length ? cfg.leagues : DEFAULT_LEAGUES;
  const visibleLeagues = leagues.filter((l) => l.visible !== false);

  return (
    <BadgeCtx.Provider value={settings}>
      <div className="px-4 space-y-3">
        {visibleLeagues.map((l, i) => (
          <LeagueCard
            key={l.key}
            leagueKey={l.key}
            defaultOpen={i === 0}
            showStandingsToggle={!CUP_LEAGUES.includes(l.key)}
          />
        ))}
      </div>
    </BadgeCtx.Provider>
  );
};

export default BrasileiraoTable;