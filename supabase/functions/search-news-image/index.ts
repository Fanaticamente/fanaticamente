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
  return unique.join(" ") || title;
}

const VARIATIONS = ["foto", "imagem jogador", "notícia foto", "partida foto"];

async function firecrawlSearch(apiKey: string, query: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 6,
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
  const m = text.match(/(?:foto|cr[ée]dito|imagem)\s*[:\-–]\s*([^\n\(\)\[\]|]{2,80})/i);
  if (!m) return null;
  const raw = m[1].trim().replace(/\s{2,}/g, " ").replace(/[\.,;]+$/, "");
  const parts = raw.split(/\s*(?:\/|\|| - | — )\s*/).filter(Boolean);
  const normalized = parts.length >= 2 ? `${parts[0].trim()} / ${parts.slice(1).join(" ").trim()}` : raw;
  return `Foto: ${normalized}`;
}

function siteCredit(pageUrl: unknown): string {
  try {
    const host = new URL(String(pageUrl)).hostname.replace(/^www\./, "");
    return `Foto: Divulgação / ${host}`;
  } catch {
    return "Foto: Divulgação";
  }
}

function imageCandidates(row: Record<string, any>): string[] {
  const meta = row?.metadata ?? {};
  return [meta.ogImage, meta["og:image"], meta.image, meta.twitterImage, row.imageUrl]
    .flat()
    .filter((u: unknown): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
}

function pickImage(rows: Array<Record<string, any>>, exclude: string[]) {
  let fallback: { url: string; source?: string; credits: string } | null = null;

  for (const row of rows) {
    const credits = extractCredits(row?.markdown) ?? extractCredits(row?.description);
    for (const url of imageCandidates(row)) {
      if (exclude.includes(url)) continue;
      if (/\.svg($|\?)/i.test(url)) continue;
      if (credits) return { url, source: row.url as string | undefined, credits };
      if (!fallback) fallback = { url, source: row.url as string | undefined, credits: siteCredit(row.url) };
    }
  }
  return fallback;
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

    const base = keywords(title, content);
    // Two variations in parallel: keeps it fast and greatly improves hit rate.
    const q1 = `${base} ${VARIATIONS[attempt % VARIATIONS.length]}`.trim();
    const q2 = `${base} ${VARIATIONS[(attempt + 1) % VARIATIONS.length]}`.trim();
    console.log("[search-news-image] queries:", q1, "|", q2);

    const [rowsA, rowsB] = await Promise.all([
      firecrawlSearch(apiKey, q1),
      firecrawlSearch(apiKey, q2),
    ]);
    const found = pickImage([...rowsA, ...rowsB], exclude);

    if (!found) {
      return json({ success: false, error: "Nenhuma imagem encontrada para este texto. Tente ajustar o título." }, 200);
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
