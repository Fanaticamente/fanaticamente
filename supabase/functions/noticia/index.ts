import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=br.com.app.gpu3041153.gpu2b1d548352a1db293fd37c557fea3180";
const APP_STORE =
  "https://apps.apple.com/br/app/fanaticamente-futebol-sa%C3%BAde/id6754257086";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripMarks = (s: string) =>
  s.replace(/\*\*/g, "").replace(/__/g, "").replace(/\*/g, "").trim();

const page = (body: string, head: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>${head}<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5f4;color:#111}
.wrap{max-width:680px;margin:0 auto;background:#fff;min-height:100vh}
.bar{padding:14px 20px;border-bottom:1px solid #e5e5e5;font-size:12px;letter-spacing:.26em;text-transform:uppercase;color:#237B0E;font-weight:700}
img.hero{width:100%;height:auto;display:block}
.cap{background:#fafafa;border-bottom:1px solid #eee;padding:8px 20px;font-size:12px;color:#666}
.c{padding:22px 20px 32px}
h1{font-size:26px;line-height:1.2;margin:0 0 6px}
.meta{font-size:13px;color:#777;margin-bottom:18px}
p{font-family:Georgia,"Times New Roman",serif;font-size:17px;line-height:1.75;text-align:justify;margin:0 0 14px}
.cta{border-top:1px solid #e5e5e5;margin-top:26px;padding-top:22px;text-align:center}
.cta p{font-family:inherit;font-size:15px;text-align:center;color:#444}
a.btn{display:block;background:#237B0E;color:#fff;text-decoration:none;font-weight:700;padding:15px 18px;border-radius:12px;margin:10px 0}
a.alt{background:#111}
.ft{padding:24px 20px 40px;text-align:center;color:#999;font-size:12px}
</style></head><body><div class="wrap">${body}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } },
  );

const storeButtons = `<div class="cta">
  <p id="redirect-msg"><strong>Abrindo a loja do seu celular…</strong><br/>Baixe o app Fanaticamente para ler a notícia completa.</p>
  <a class="btn" href="${PLAY_STORE}">Baixar no Android (Play Store)</a>
  <a class="btn alt" href="${APP_STORE}">Baixar no iPhone (App Store)</a>
</div>
<div class="ft">Fanaticamente · fanaticamente.com</div>
<script>
(function(){
  var ua = navigator.userAgent || "";
  var store = /iPhone|iPad|iPod/i.test(ua) ? "${APP_STORE}" : (/Android/i.test(ua) ? "${PLAY_STORE}" : null);
  if (!store) return;
  var timer = setTimeout(function(){ window.location.href = store; }, 1200);
  document.addEventListener("click", function(){ clearTimeout(timer); var m = document.getElementById("redirect-msg"); if (m) m.innerHTML = "<strong>Leia tudo no aplicativo Fanaticamente</strong><br/>Futebol e saúde mental no mesmo lugar."; }, { once: true });
})();
</script>`;

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const id =
      url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "";

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return page(
        `<div class="bar">Fanaticamente</div><div class="c"><h1>Notícia não encontrada</h1></div>${storeButtons}`,
        `<title>Fanaticamente</title>`,
        404,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: news } = await supabase
      .from("football_news")
      .select(
        "id, rewritten_title, rewritten_content, image_url, image_caption, image_credits, category, published_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (!news) {
      return page(
        `<div class="bar">Fanaticamente</div><div class="c"><h1>Notícia não encontrada</h1></div>${storeButtons}`,
        `<title>Fanaticamente</title>`,
        404,
      );
    }

    // Same-origin-safe image proxy used only to prepare the news photo for
    // native sharing. This avoids third-party image servers blocking CORS.
    if (url.searchParams.get("image") === "1") {
      if (!news.image_url) {
        return new Response(null, { status: 404, headers: corsHeaders });
      }

      const imageResponse = await fetch(news.image_url);
      if (!imageResponse.ok || !imageResponse.body) {
        return new Response(null, { status: 502, headers: corsHeaders });
      }

      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isPreviewCrawler =
      /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot/i.test(
        userAgent,
      );

    // Visitors go straight to the correct store. Only social crawlers receive
    // the metadata document used to build the title and image preview.
    if (!isPreviewCrawler) {
      const destination = /iPhone|iPad|iPod/i.test(userAgent)
        ? APP_STORE
        : /Android/i.test(userAgent)
          ? PLAY_STORE
          : "https://www.fanaticamente.com";

      return new Response(null, {
        status: 302,
        headers: {
          Location: destination,
          "Cache-Control": "no-store",
        },
      });
    }

    const title = stripMarks(news.rewritten_title || "Fanaticamente");
    const content = stripMarks(news.rewritten_content || "");
    const description = "Leia essa notícia completa no app Fanaticamente — baixe grátis na App Store ou no Google Play.";
    const shareUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/noticia?id=${news.id}`;

    const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${esc(shareUrl)}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Fanaticamente"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${esc(shareUrl)}"/>
${news.image_url ? `<meta property="og:image" content="${esc(news.image_url)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>` : ""}
<meta name="twitter:card" content="${news.image_url ? "summary_large_image" : "summary"}"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${news.image_url ? `<meta name="twitter:image" content="${esc(news.image_url)}"/>` : ""}`;

    const date = new Date(news.published_at).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const caption = [news.image_caption, news.image_credits]
      .filter(Boolean)
      .map((t) => String(t).replace(/^\d+ de \d+\s*/i, "").trim())
      .join(" — ");

    const paragraphs = content
      .split(/\n{1,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((p) => `<p>${esc(p)}</p>`)
      .join("");

    const body = `<div class="bar">${esc(news.category || "Futebol")} · Fanaticamente</div>
${news.image_url ? `<img class="hero" src="${esc(news.image_url)}" alt="${esc(title)}"/>${caption ? `<div class="cap">${esc(caption)}</div>` : ""}` : ""}
<div class="c">
  <h1>${esc(title)}</h1>
  <div class="meta">${esc(date)}</div>
  ${paragraphs}
  ${storeButtons}
</div>`;

    return page(body, head);
  } catch (e) {
    console.error("[noticia] error", e);
    return page(
      `<div class="bar">Fanaticamente</div><div class="c"><h1>Erro ao carregar a notícia</h1></div>${storeButtons}`,
      `<title>Fanaticamente</title>`,
      500,
    );
  }
});
