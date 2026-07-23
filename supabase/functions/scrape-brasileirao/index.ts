const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min (user-requested refresh cadence)
const cacheByLeague: Record<string, { at: number; payload: unknown }> = {};
const scorerCache: Record<string, { at: number; payload: unknown }> = {};
const SCORER_TTL_MS = 45 * 1000; // 45s for live match details

// Fotmob league ids. Values are best-effort — endpoint returns 200 with empty
// standings for cup formats, which the UI handles gracefully.
const LEAGUES: Record<string, { id: number; label: string; format: "league" | "cup" }> = {
  "serie-a":            { id: 268,   label: "Brasileirão Série A",         format: "league" },
  "serie-b":            { id: 8814,  label: "Brasileirão Série B",         format: "league" },
  "serie-c":            { id: 8971,  label: "Brasileirão Série C",         format: "league" },
  "copa-do-brasil":     { id: 9067,  label: "Copa do Brasil",              format: "cup"    },
  "libertadores":       { id: 44,    label: "Copa Libertadores",           format: "cup"    },
  "sul-americana":      { id: 299,   label: "Copa Sul-Americana",          format: "cup"    },
};

const NAME_FIXES: Record<string, string> = {
  "Atletico MG": "Atlético-MG",
  "Athletico Paranaense": "Athletico-PR",
  "Sao Paulo": "São Paulo",
  "Gremio": "Grêmio",
  "Cuiaba": "Cuiabá",
  "Goias": "Goiás",
  "America MG": "América-MG",
  "Ceara": "Ceará",
  "Vitoria": "Vitória",
  "Atletico GO": "Atlético-GO",
  "Red Bull Bragantino": "RB Bragantino",
  "Chapecoense-SC": "Chapecoense",
  "Chapecoense AF": "Chapecoense",
  "Santos FC": "Santos",
  "Coritiba FC": "Coritiba",
  "Sao Paulo FC": "São Paulo",
  "Sport Recife": "Sport",
};

function fixName(n: string): string {
  if (NAME_FIXES[n]) return NAME_FIXES[n];
  // Strip trailing FC / EC / SC / AF suffix
  return n.replace(/\s+(FC|EC|SC|AF)$/i, "").trim();
}

const WEEKDAYS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Format a UTC ISO string as Brazil time (America/Sao_Paulo)
function formatBRT(utcIso: string): { date: string; weekday: string; time: string } {
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return { date: "", weekday: "", time: "" };
  // Build a fresh Date in BRT via Intl parts
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wkShort = get("weekday").toLowerCase();
  const wkMap: Record<string, string> = {
    sun: "Domingo", mon: "Segunda", tue: "Terça", wed: "Quarta",
    thu: "Quinta", fri: "Sexta", sat: "Sábado",
  };
  return {
    date: `${get("day")}/${get("month")}`,
    weekday: wkMap[wkShort] ?? "",
    time: `${get("hour")}:${get("minute")}`,
  };
}

function abbrOf(n: string): string {
  const fixed = fixName(n);
  const parts = fixed.replace(/[-]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0] + (parts[2]?.[0] ?? "")).toUpperCase().slice(0, 3);
}

async function fetchFotmob(leagueId: number): Promise<any> {
  const res = await fetch(`https://www.fotmob.com/api/data/leagues?id=${leagueId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Fotmob fetch failed: ${res.status}`);
  return res.json();
}

async function fetchMatchDetails(matchId: string): Promise<any> {
  const res = await fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Fotmob matchDetails failed: ${res.status}`);
  return res.json();
}

function extractScorers(details: any): Array<{ team: "home" | "away"; player: string; minute: string }> {
  const events = details?.content?.matchFacts?.events?.events
    ?? details?.header?.events
    ?? [];
  const out: Array<{ team: "home" | "away"; player: string; minute: string }> = [];
  for (const ev of Array.isArray(events) ? events : []) {
    const type = String(ev?.type ?? ev?.eventType ?? "").toLowerCase();
    if (!type.includes("goal")) continue;
    if (String(ev?.ownGoal ?? "").toLowerCase() === "true") { /* still count */ }
    const isHome = ev?.isHome === true || ev?.side === "home";
    const player = ev?.player?.name ?? ev?.nameStr ?? ev?.name ?? "";
    const minute = ev?.timeStr ?? (ev?.time != null ? `${ev.time}'` : "");
    if (player) out.push({ team: isHome ? "home" : "away", player, minute });
  }
  return out;
}

function buildPayload(data: any) {
  const rows: any[] = data?.table?.[0]?.data?.table?.all ?? [];
  const standings = rows.map((r, i) => ({
    position: r.idx ?? i + 1,
    club: fixName(r.name),
    abbr: abbrOf(r.name),
    team_id: r.id != null ? String(r.id) : null,
    points: r.pts ?? 0,
    played: r.played ?? 0,
    wins: r.wins ?? 0,
    draws: r.draws ?? 0,
    losses: r.losses ?? 0,
    goals_for: Number(String(r.scoresStr ?? "0-0").split("-")[0]) || 0,
    goals_against: Number(String(r.scoresStr ?? "0-0").split("-")[1]) || 0,
    goal_diff: r.goalConDiff ?? 0,
  }));

  const allMatches: any[] = data?.fixtures?.allMatches ?? [];
  const firstUnplayedId: string | undefined = data?.fixtures?.firstUnplayedMatch?.firstUnplayedMatchId;
  const startIdx = firstUnplayedId
    ? allMatches.findIndex((m) => String(m.id) === String(firstUnplayedId))
    : allMatches.findIndex((m) => !m.status?.finished);
  const upcoming = startIdx >= 0 ? allMatches.slice(startIdx) : [];
  const nextRoundNum = upcoming[0]?.round;

  const next_round = upcoming
    .filter((m) => m.round === nextRoundNum)
    .slice(0, 10)
    .map((m) => {
      const brt = formatBRT(m.status?.utcTime ?? "");
      return {
        date: brt.date,
        weekday: brt.weekday,
        time: brt.time,
        venue: "",
        home: fixName(m.home?.name ?? ""),
        home_abbr: abbrOf(m.home?.name ?? ""),
        home_id: m.home?.id != null ? String(m.home.id) : null,
        away: fixName(m.away?.name ?? ""),
        away_abbr: abbrOf(m.away?.name ?? ""),
        away_id: m.away?.id != null ? String(m.away.id) : null,
      };
    });

  return { standings, next_round, updated_at: new Date().toISOString() };
}

function buildMatches(data: any) {
  const allMatches: any[] = data?.fixtures?.allMatches ?? [];
  return allMatches.map((m) => {
    const st = m.status ?? {};
    const started = !!st.started;
    const finished = !!st.finished;
    const cancelled = !!st.cancelled;
    const ongoing = started && !finished && !cancelled;
    const scoreStr = typeof st.scoreStr === "string" ? st.scoreStr : "";
    const scoreParts = scoreStr.split("-").map((p: string) => p.trim());
    const parseScore = (side: any, idx: number): number | null => {
      if (typeof side?.score === "number") return side.score;
      if (typeof side?.score === "string" && side.score !== "") {
        const n = Number(side.score);
        if (!isNaN(n)) return n;
      }
      if (scoreParts[idx] !== undefined) {
        const n = Number(scoreParts[idx]);
        if (!isNaN(n)) return n;
      }
      return null;
    };
    return {
      id: String(m.id ?? ""),
      round: m.round ?? null,
      utcTime: st.utcTime ?? null,
      home: fixName(m.home?.name ?? ""),
      home_abbr: abbrOf(m.home?.name ?? ""),
      home_id: m.home?.id != null ? String(m.home.id) : null,
      away: fixName(m.away?.name ?? ""),
      away_abbr: abbrOf(m.away?.name ?? ""),
      away_id: m.away?.id != null ? String(m.away.id) : null,
      home_score: parseScore(m.home, 0),
      away_score: parseScore(m.away, 1),
      status: cancelled ? "cancelled" : finished ? "finished" : ongoing ? "live" : "scheduled",
      live_minute: ongoing ? (st.liveTime?.short ?? st.liveTime?.long ?? null) : null,
      score_str: scoreStr || null,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const action = url.searchParams.get("action");

    // Body may also carry params when invoked via supabase.functions.invoke
    let body: any = null;
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = null; }
    }
    const leagueKey = (url.searchParams.get("league") ?? body?.league ?? "serie-a").toLowerCase();
    const matchIdParam = url.searchParams.get("matchId") ?? body?.matchId;
    const actionParam = action ?? body?.action;

    // --- Live scorers endpoint --------------------------------------------
    if (actionParam === "scorers" && matchIdParam) {
      const key = String(matchIdParam);
      const cached = scorerCache[key];
      if (!force && cached && Date.now() - cached.at < SCORER_TTL_MS) {
        return new Response(JSON.stringify({ success: true, cached: true, ...cached.payload as object }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const details = await fetchMatchDetails(key);
      const scorers = extractScorers(details);
      const payload = { scorers, updated_at: new Date().toISOString() };
      scorerCache[key] = { at: Date.now(), payload };
      return new Response(JSON.stringify({ success: true, cached: false, ...payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- League payload endpoint ------------------------------------------
    const league = LEAGUES[leagueKey] ?? LEAGUES["serie-a"];
    const cacheKey = String(league.id);
    const cached = cacheByLeague[cacheKey];
    if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ success: true, cached: true, league: leagueKey, label: league.label, format: league.format, ...cached.payload as object }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await fetchFotmob(league.id);
    const base = buildPayload(data);
    const matches = buildMatches(data);
    const payload = { ...base, matches };
    cacheByLeague[cacheKey] = { at: Date.now(), payload };

    return new Response(JSON.stringify({ success: true, cached: false, league: leagueKey, label: league.label, format: league.format, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[scrape-brasileirao]", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});