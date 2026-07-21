import { useMemo } from "react";
import { useBrasileirao, type MatchRow } from "@/hooks/useBrasileirao";
import { useClubTheme } from "@/contexts/ClubThemeContext";
import { brazilianClubs } from "@/data/brazilianClubs";
import ClubMark from "@/components/clubs/ClubMark";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const findClubId = (name: string, abbr?: string): string | null => {
  const n = normalize(name);
  const a = abbr ? abbr.toUpperCase() : "";
  let found = brazilianClubs.find(
    (c) =>
      normalize(c.name) === n ||
      normalize(c.shortName) === n ||
      (a && c.shortName.toUpperCase() === a) ||
      normalize(c.id) === n.replace(/\s+/g, "-"),
  );
  if (!found) {
    found = brazilianClubs.find((c) => {
      const cn = normalize(c.name);
      return cn && (n.startsWith(cn) || cn.startsWith(n) || n.includes(cn));
    });
  }
  return found?.id ?? null;
};

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
  const lastFinished = mine
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.utcTime ?? 0).getTime() - new Date(a.utcTime ?? 0).getTime());
  return lastFinished[0] ?? null;
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
  const { data } = useBrasileirao(!!clubId);

  const match = useMemo(() => {
    if (!clubId || !data?.matches) return null;
    return pickMatchForClub(data.matches, clubId);
  }, [clubId, data]);

  if (!clubId || !match) return null;

  const homeId = findClubId(match.home, match.home_abbr);
  const awayId = findClubId(match.away, match.away_abbr);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;
  const { day, time } = formatDateTime(match.utcTime);

  return (
    <div
      className="rounded-2xl border bg-white px-3 py-2.5 flex items-center gap-3"
      style={{ borderColor: "var(--club-200)" }}
    >
      {/* Status pill */}
      <div className="flex flex-col items-center min-w-[52px]">
        {isLive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "#dc2626" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            AO VIVO
          </span>
        ) : isFinished ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 bg-gray-100">
            ENCERRADO
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: "var(--club-700)", backgroundColor: "var(--club-100)" }}>
            PRÓXIMO
          </span>
        )}
        <span className="text-[10px] text-gray-500 mt-1 leading-tight text-center">
          {isLive ? `${match.live_minute ?? ""}${match.live_minute ? "'" : ""}` : `${day}${day && time ? " · " : ""}${time}`}
        </span>
      </div>

      {/* Home */}
      <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
        <span className="text-xs font-semibold text-gray-800 truncate text-right">{match.home_abbr || match.home}</span>
        <div className="w-7 h-7 shrink-0">
          {homeId ? <ClubMark clubId={homeId} /> : null}
        </div>
      </div>

      {/* Score / vs */}
      <div className="shrink-0 text-sm font-extrabold text-gray-900 tabular-nums px-1">
        {showScore ? `${match.home_score ?? 0} × ${match.away_score ?? 0}` : "×"}
      </div>

      {/* Away */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 shrink-0">
          {awayId ? <ClubMark clubId={awayId} /> : null}
        </div>
        <span className="text-xs font-semibold text-gray-800 truncate">{match.away_abbr || match.away}</span>
      </div>
    </div>
  );
};

export default NextMatchBar;