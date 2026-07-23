import { useEffect, useMemo, useState } from "react";
import { useLeague, type MatchRow, type LeagueKey } from "@/hooks/useBrasileirao";
import { useClubTheme } from "@/contexts/ClubThemeContext";
import TeamBadge from "@/components/clubs/TeamBadge";
import { findClubId, cleanDisplayName } from "@/lib/clubMatcher";
import { brazilianClubs } from "@/data/brazilianClubs";
import { supabase } from "@/integrations/supabase/client";

// Leagues to consider for "next match by date across all competitions".
const LEAGUES_TO_CHECK: LeagueKey[] = [
  "serie-a",
  "serie-b",
  "serie-c",
  "copa-do-brasil",
  "libertadores",
  "sul-americana",
];

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const isMyClub = (myId: string, matchName: string, matchAbbr?: string) => {
  const found = findClubId(matchName, matchAbbr);
  return found === myId;
};

const pickMatchForClub = (matches: MatchRow[], clubId: string): MatchRow | null => {
  const mine = matches.filter(
    (m) => isMyClub(clubId, m.home, m.home_abbr) || isMyClub(clubId, m.away, m.away_abbr),
  );
  if (mine.length === 0) return null;
  const live = mine.find((m) => m.status === "live");
  if (live) return live;
  const now = Date.now();
  const upcoming = mine
    .filter((m) => m.status === "scheduled" && m.utcTime && new Date(m.utcTime).getTime() >= now - 60_000)
    .sort((a, b) => new Date(a.utcTime!).getTime() - new Date(b.utcTime!).getTime());
  if (upcoming.length) return upcoming[0];
  return null;
};

const formatDateTime = (utc: string | null) => {
  if (!utc) return { day: "", time: "" };
  const d = new Date(utc);
  if (isNaN(d.getTime())) return { day: "", time: "" };
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  let day = "";
  if (sameDay) day = "Hoje";
  else if (isTomorrow) day = "Amanhã";
  else day = `${WEEKDAYS[d.getDay()].slice(0, 3)} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return { day, time };
};

const NextMatchBar = () => {
  const { clubId } = useClubTheme();

  // Pull matches from every relevant competition; each hook has its own cache
  // so the bar renders instantly from localStorage on cold open.
  const leagueData = LEAGUES_TO_CHECK.map((key) => useLeague(key, !!clubId).data);

  const match = useMemo(() => {
    if (!clubId) return null;
    const all: MatchRow[] = [];
    for (const d of leagueData) {
      if (d?.matches) all.push(...d.matches);
    }
    return pickMatchForClub(all, clubId);
  }, [clubId, leagueData]);

  // Live scorers (loaded lazily for live matches only)
  const [scorers, setScorers] = useState<Array<{ team: "home" | "away"; player: string; minute: string }>>([]);
  useEffect(() => {
    if (!match || match.status !== "live" || !match.id) {
      setScorers([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("scrape-brasileirao", {
          body: { action: "scorers", matchId: match.id },
        });
        if (!cancelled && data?.success && Array.isArray(data.scorers)) {
          setScorers(data.scorers);
        }
      } catch {
        /* silent */
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [match?.id, match?.status]);

  if (!clubId || !match) return null;

  const homeId = findClubId(match.home, match.home_abbr);
  const awayId = findClubId(match.away, match.away_abbr);
  const homeName = cleanDisplayName(match.home);
  const awayName = cleanDisplayName(match.away);
  const homeShort = homeId
    ? (brazilianClubs.find((c) => c.id === homeId)?.shortName ?? match.home_abbr)
    : match.home_abbr;
  const awayShort = awayId
    ? (brazilianClubs.find((c) => c.id === awayId)?.shortName ?? match.away_abbr)
    : match.away_abbr;
  const isLive = match.status === "live";
  const showScore = isLive;
  const { day, time } = formatDateTime(match.utcTime);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2.5">
      <div className="flex items-center gap-3">
      {/* Status pill */}
      <div className="flex flex-col items-center min-w-[52px]">
        {isLive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "#dc2626" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            AO VIVO
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: "var(--club-700)", backgroundColor: "var(--club-100)" }}>
            próxima partida
          </span>
        )}
        <span className="text-[10px] text-gray-500 mt-1 leading-tight text-center">
          {isLive ? `${match.live_minute ?? ""}${match.live_minute ? "'" : ""}` : `${day}${day && time ? " · " : ""}${time}`}
        </span>
      </div>

      {/* Home */}
      <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
        <span className="text-xs font-semibold text-gray-800 truncate text-right">{homeShort || homeName}</span>
        <div className="w-7 h-7 shrink-0">
          <TeamBadge clubId={homeId} fotmobId={match.home_id} alt={homeName} />
        </div>
      </div>

      {/* Score / vs */}
      <div className="shrink-0 text-sm font-extrabold text-gray-900 tabular-nums px-1">
        {showScore ? `${match.home_score ?? 0} × ${match.away_score ?? 0}` : "×"}
      </div>

      {/* Away */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 shrink-0">
          <TeamBadge clubId={awayId} fotmobId={match.away_id} alt={awayName} />
        </div>
        <span className="text-xs font-semibold text-gray-800 truncate">{awayShort || awayName}</span>
      </div>
      </div>

      {/* Live scorers */}
      {isLive && scorers.length > 0 && (
        <div className="mt-1.5 flex items-start gap-3 text-[9px] leading-tight text-gray-500">
          <div className="min-w-[52px]" aria-hidden />
          <div className="flex-1 text-right space-y-0.5 min-w-0">
            {scorers.filter((s) => s.team === "home").map((s, i) => (
              <div key={`h-${i}`} className="truncate">{s.player} <span className="text-gray-400">{s.minute}</span></div>
            ))}
          </div>
          <div className="shrink-0 px-1 text-sm font-extrabold tabular-nums invisible">0 × 0</div>
          <div className="flex-1 space-y-0.5 min-w-0">
            {scorers.filter((s) => s.team === "away").map((s, i) => (
              <div key={`a-${i}`} className="truncate">{s.player} <span className="text-gray-400">{s.minute}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NextMatchBar;