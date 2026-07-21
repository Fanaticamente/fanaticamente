const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
let cache: { at: number; payload: unknown } | null = null;

// Fotmob league id for Brasileirão Série A (same data source Google surfaces via Opta partners).
const FOTMOB_URL = "https://www.fotmob.com/api/data/leagues?id=268";

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
};

function fixName(n: string): string {
  return NAME_FIXES[n] ?? n;
}

function abbrOf(n: string): string {
  const fixed = fixName(n);
  const parts = fixed.replace(/[-]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0] + (parts[2]?.[0] ?? "")).toUpperCase().slice(0, 3);
}

async function fetchFotmob(): Promise<any> {
  const res = await fetch(FOTMOB_URL, {
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

function buildPayload(data: any) {
  const rows: any[] = data?.table?.[0]?.data?.table?.all ?? [];
  const standings = rows.map((r, i) => ({
    position: r.idx ?? i + 1,
    club: fixName(r.name),
    abbr: abbrOf(r.name),
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
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const next_round = upcoming
    .filter((m) => m.round === nextRoundNum)
    .slice(0, 10)
    .map((m) => {
      const d = new Date(m.status?.utcTime);
      const pad = (n: number) => String(n).padStart(2, "0");
      const isValid = !isNaN(d.getTime());
      return {
        date: isValid ? `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}` : "",
        weekday: isValid ? weekdays[d.getUTCDay()] : "",
        time: isValid ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : "",
        venue: "",
        home: fixName(m.home?.name ?? ""),
        home_abbr: abbrOf(m.home?.name ?? ""),
        away: fixName(m.away?.name ?? ""),
        away_abbr: abbrOf(m.away?.name ?? ""),
      };
    });

  return { standings, next_round, updated_at: new Date().toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ success: true, cached: true, ...cache.payload as object }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await fetchFotmob();
    const payload = buildPayload(data);
    cache = { at: Date.now(), payload };

    return new Response(JSON.stringify({ success: true, cached: false, ...payload }), {
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