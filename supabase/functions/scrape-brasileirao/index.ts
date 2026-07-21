import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
let cache: { at: number; payload: unknown } | null = null;

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function extractWithAI(text: string) {
  const KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = `Você recebe o texto de uma página do ge.globo com a classificação e jogos do Brasileirão Série A.

Extraia estritamente em JSON:
{
  "standings": [
    { "position": 1, "club": "Palmeiras", "abbr": "PAL", "points": 41, "played": 18, "wins": 12, "draws": 5, "losses": 1, "goals_for": 30, "goals_against": 13, "goal_diff": 17 }
  ],
  "next_round": [
    { "date": "22/07", "weekday": "Terça", "time": "19:30", "venue": "Couto Pereira", "home": "Coritiba", "home_abbr": "CFC", "away": "Palmeiras", "away_abbr": "PAL" }
  ]
}

Regras:
- Retorne 20 times na classificação, ordenados por posição.
- Em next_round inclua apenas jogos ainda NÃO realizados (sem placar). Máximo 10.
- Use nomes próprios com capitalização correta (São Paulo, Grêmio, Atlético-MG).
- Responda APENAS o JSON, sem markdown.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text.slice(0, 18000) },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  return JSON.parse(match[0]);
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

    const html = await fetchHtml("https://ge.globo.com/futebol/brasileirao-serie-a/");
    const text = htmlToText(html);
    const parsed = await extractWithAI(text);

    const payload = {
      standings: Array.isArray(parsed.standings) ? parsed.standings : [],
      next_round: Array.isArray(parsed.next_round) ? parsed.next_round : [],
      updated_at: new Date().toISOString(),
    };
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