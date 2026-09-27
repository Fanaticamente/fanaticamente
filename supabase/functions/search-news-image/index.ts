import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BUCKET = "health-news";

function keywords(title: string, content: string): string {
  const stop = new Set([
    "para","com","uma","que","dos","das","por","não","mais","como","sobre","seu","sua","the","and",
    "foi","ele","ela","este","esta","pelo","pela","até","após","onde","quando","mas","nos","nas","era",
  ]);
  const words = `${title} ${content}`
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.replace(/[^\p{L}\p{N}\-]/gu, ""))
    .filter((w) => w.length > 3 && !stop.has(w.toLowerCase()));

  const unique: string[] = [];
  for (const w of words) {
    if (!unique.some((u) => u.toLowerCase() === w.toLowerCase())) unique.push(w);
    if (unique.length >= 7) break;
  }
  return unique.slice(0, 5).join(" ") || title;
}

const VARIATIONS = ["", "foto", "notícia", "anúncio"];

const ENTITY_STOP = new Set([
  "o","a","os","as","de","da","do","das","dos","e","em","no","na","com","para","por","um","uma",
  "apos","após","sobre","contra","novo","nova","veja","confira","entenda","saiba","recebe","recebeu",
]);

// Heuristic: sequences of capitalized words in the title (e.g. "Corinthians", "Fatal Model").
function heuristicEntities(title: string): string[] {
  const tokens = title.replace(/[“”"'‘’:;,.!?()\[\]]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur: string[] = [];
  const flush = () => { if (cur.length) out.push(cur.join(" ")); cur = []; };
  tokens.forEach((t, i) => {
    const cap = /^[\p{Lu}0-9]/u.test(t);
    const low = normalize(t);
    if (cap && !(i === 0 && ENTITY_STOP.has(low))) cur.push(t);
    else if (cur.length && ["de","da","do","dos","das"].includes(low)) cur.push(t);
    else flush();
  });
  flush();
  return [...new Set(out.map((e) => e.replace(/\s+(de|da|do|dos|das)$/i, "")))]
    .filter((e) => e.length > 2 && !ENTITY_STOP.has(normalize(e)))
    .slice(0, 3);
}

// Uses AI (when configured) to extract the 2 central subjects: "who" and "with whom/what".
async function extractEntities(title: string, content: string): Promise<string[]> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (key) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Extraia os 2 pontos centrais (quem/protagonistas: clubes, pessoas, empresas, marcas, competições) de uma notícia. Responda JSON {\"entities\": [\"...\", \"...\"]} com nomes próprios curtos, no máximo 3, o principal primeiro. Ex.: 'Corinthians recebe oferta da Fatal Model' -> [\"Corinthians\", \"Fatal Model\"]." },
            { role: "user", content: `Título: ${title}\nTexto: ${content.slice(0, 600)}` },
          ],
        }),
      });
      if (res.ok) {
        const body = await res.json();
        const parsed = JSON.parse(body?.choices?.[0]?.message?.content ?? "{}");
        const list = (parsed?.entities ?? []).filter((e: unknown): e is string => typeof e === "string" && e.trim().length > 1);
        if (list.length) return list.slice(0, 3).map((e: string) => e.trim());
      }
    } catch (e) {
      console.error("[search-news-image] entity extraction failed", e);
    }
  }
  return heuristicEntities(title);
}

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const GENERIC_CREDITS = new Set([
  "reproducao", "divulgacao", "arquivo", "internet", "redes sociais",
  "instagram", "facebook", "twitter", "x", "assessoria de imprensa",
]);

const BLOCKED_IMAGE_PARTS = [
  "logo", "icon", "favicon", "avatar", "sprite", "placeholder", "badge",
  "escudo", "banner", "tracking", "pixel", "ads", "advert",
];

const BLOCKED_SOURCES = [
  "google.com", "bing.com", "youtube.com", "facebook.com", "instagram.com",
  "x.com", "twitter.com", "pinterest.", "wikipedia.org",
];

async function firecrawlSearch(apiKey: string, query: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 10,
      lang: "pt",
      country: "br",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("[search-news-image] firecrawl error", res.status, JSON.stringify(body)?.slice(0, 500));
    return [];
  }
  const rows = (body?.data?.web ?? body?.data ?? []) as Array<Record<string, any>>;
  return Array.isArray(rows) ? rows : [];
}

// Extracts "Foto: Autor / Veículo" (or similar credit lines) from page text.
function extractCredits(text: unknown): string | null {
  if (typeof text !== "string" || !text) return null;
  const matches = text.matchAll(/(?:foto(?:grafia)?|cr[ée]dito(?:s)?(?: da imagem)?|imagem)\s*[:\-–—]\s*([^\n\(\)\[\]|]{2,100})/gi);
  for (const match of matches) {
    const raw = match[1]
      .trim()
      .replace(/\s{2,}/g, " ")
      .replace(/(?:\s+[—–-]\s+)?(?:leia|veja|saiba|publicado).*$/i, "")
      .replace(/[\.,;]+$/, "");
    const normalizedRaw = normalize(raw.replace(/^foto\s*:\s*/i, ""));
    if (!raw || GENERIC_CREDITS.has(normalizedRaw) || raw.length > 100) continue;
    const parts = raw.split(/\s*(?:\/|\||\s+[—–-]\s+)\s*/).filter(Boolean);
    const credit = parts.length >= 2
      ? `${parts[0].trim()} / ${parts.slice(1).join(" / ").trim()}`
      : raw;
    return `Foto: ${credit}`;
  }
  return null;
}

function sourceName(row: Record<string, any>): string | null {
  const meta = row?.metadata ?? {};
  const named = [meta.siteName, meta["og:site_name"], meta.publisher]
    .find((value) => typeof value === "string" && value.trim().length >= 2);
  if (typeof named === "string") return named.trim().slice(0, 60);
  try {
    const host = new URL(String(row?.url)).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

function completeCredits(credits: string, row: Record<string, any>): string {
  const source = sourceName(row);
  if (!source || credits.includes(" / ")) return credits;
  return `${credits} / ${source}`;
}

function imageCandidates(row: Record<string, any>): string[] {
  const meta = row?.metadata ?? {};
  return [meta.ogImage, meta["og:image"], meta.image, meta.twitterImage, row.imageUrl]
    .flat()
    .filter((u: unknown): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
}

function sourceAllowed(pageUrl: unknown): boolean {
  if (typeof pageUrl !== "string") return false;
  const normalizedUrl = normalize(pageUrl);
  return !BLOCKED_SOURCES.some((part) => normalizedUrl.includes(part));
}

function imageAllowed(imageUrl: string): boolean {
  const normalizedUrl = normalize(imageUrl);
  return !/\.svg($|\?)/i.test(imageUrl)
    && !BLOCKED_IMAGE_PARTS.some((part) => normalizedUrl.includes(part));
}

function relevantTerms(title: string): string[] {
  return normalize(title)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 8);
}

function relevance(row: Record<string, any>, terms: string[]): number {
  const haystack = normalize(`${row?.title ?? ""} ${row?.description ?? ""} ${row?.url ?? ""}`);
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function mentionsEntity(row: Record<string, any>, entity: string): boolean {
  const haystack = normalize(`${row?.title ?? ""} ${row?.description ?? ""} ${row?.url ?? ""} ${String(row?.markdown ?? "").slice(0, 3000)}`)
    .replace(/[-_]/g, " ");
  const parts = normalize(entity).split(/\s+/).filter((p) => p.length > 2);
  return parts.length > 0 && parts.every((p) => haystack.includes(p));
}

function pickImage(rows: Array<Record<string, any>>, exclude: string[], title: string, entities: string[]) {
  const terms = relevantTerms(title);
  const seen = new Set<string>();
  const ranked = rows
    .filter((row) => sourceAllowed(row?.url))
    .filter((row) => { const u = String(row?.url); if (seen.has(u)) return false; seen.add(u); return true; })
    // Page must talk about ALL central subjects of the news (e.g. Corinthians AND Fatal Model).
    .filter((row) => entities.length === 0 || entities.every((e) => mentionsEntity(row, e)))
    .map((row) => ({ row, score: relevance(row, terms) }))
    .filter(({ score }) => entities.length > 0 || score >= Math.min(2, Math.max(1, terms.length)))
    .sort((a, b) => b.score - a.score);

  for (const { row } of ranked) {
    const meta = row?.metadata ?? {};
    const credits = extractCredits(meta.ogImageAlt)
      ?? extractCredits(meta["og:image:alt"])
      ?? extractCredits(meta.imageAlt)
      ?? extractCredits(row?.markdown)
      ?? extractCredits(row?.description);
    if (!credits) continue;
    for (const url of imageCandidates(row)) {
      if (exclude.includes(url)) continue;
      if (!imageAllowed(url)) continue;
      return {
        url,
        source: row.url as string | undefined,
        credits: completeCredits(credits, row),
      };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ success: false, error: "Authorization required" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: claims } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!claims?.user) return json({ success: false, error: "Invalid or expired token" }, 401);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.user.id)
      .in("role", ["admin", "developer"]);
    if (!roles?.some((r: { role: string }) => ["admin", "developer"].includes(r.role))) {
      return json({ success: false, error: "Unauthorized" }, 403);
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) return json({ success: false, error: "Busca de imagens não configurada" }, 200);

    const payload = await req.json().catch(() => ({}));
    const title = String(payload?.title ?? "").slice(0, 300);
    const content = String(payload?.content ?? "").slice(0, 1200);
    const exclude = Array.isArray(payload?.exclude)
      ? (payload.exclude as unknown[]).filter((u): u is string => typeof u === "string")
      : [];
    const attempt = Number.isFinite(payload?.attempt) ? Number(payload.attempt) : 0;

    if (!title.trim() && !content.trim()) {
      return json({ success: false, error: "Escreva o texto da notícia antes de pesquisar a imagem" }, 200);
    }

    const entities = await extractEntities(title, content);
    const base = entities.length >= 2
      ? entities.map((e) => `"${e}"`).join(" ")
      : `${entities.map((e) => `"${e}"`).join(" ")} ${keywords(title, content)}`.trim();
    console.log("[search-news-image] entities:", entities);
    // Two variations in parallel: keeps it fast and greatly improves hit rate.
    const q1 = `${base} ${VARIATIONS[attempt % VARIATIONS.length]}`.trim();
    const q2 = `${base} ${VARIATIONS[(attempt + 1) % VARIATIONS.length]}`.trim();
    console.log("[search-news-image] queries:", q1, "|", q2);

    const [rowsA, rowsB] = await Promise.all([
      firecrawlSearch(apiKey, q1),
      firecrawlSearch(apiKey, q2),
    ]);
    const found = pickImage([...rowsA, ...rowsB], exclude, title, entities);

    if (!found) {
      return json({
        success: false,
        error: `Nenhuma foto com autoria confirmada relacionando ${entities.join(" e ") || "os temas da notícia"} foi encontrada. Tente novamente.`,
      }, 200);
    }

    // Persist the image in storage so it stays available.
    let finalUrl = found.url;
    try {
      const imgRes = await fetch(found.url);
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      if (imgRes.ok && contentType.startsWith("image/")) {
        const bytes = new Uint8Array(await imgRes.arrayBuffer());
        const ext = contentType.split("/")[1]?.split(";")[0]?.replace("jpeg", "jpg") || "jpg";
        const path = `futebol/noticias/web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType });
        if (!error) {
          finalUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        }
      }
    } catch (e) {
      console.error("[search-news-image] upload failed, using original url:", e);
    }

    return json({
      success: true,
      image_url: finalUrl,
      original_url: found.url,
      source_url: found.source ?? null,
      credits: found.credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na busca de imagem";
    console.error("[search-news-image] Error:", message);
    return json({ success: false, error: message }, 200);
  }
});
