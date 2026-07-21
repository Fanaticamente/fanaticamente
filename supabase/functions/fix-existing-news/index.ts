import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fetch raw HTML from a URL
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return response.text();
}

// Extract image credits from article HTML figcaption
function extractImageCredits(html: string): { imageCredits?: string; imageCaption?: string } {
  const figcaptionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  if (!figcaptionMatch) return {};
  const raw = figcaptionMatch[1].replace(/<[^>]+>/g, '').trim();
  if (raw.includes('—')) {
    const parts = raw.split('—');
    return {
      imageCaption: parts[0].trim() || undefined,
      imageCredits: parts.slice(1).join('—').trim() || undefined,
    };
  }
  if (raw.startsWith('Foto:')) return { imageCredits: raw };
  return { imageCaption: raw };
}

// Sanitize content
function cleanContent(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, '')
    .replace(/^[^\n]*adicione o ge[^\n]*/gim, '')
    .replace(/^[^\n]*fontes favoritas do google[^\n]*/gim, '')
    .replace(/^\s*\+\s*[^\n]*$/gim, '')
    .replace(/^\+\s*[^\n]*(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre|entre|compartilhe|curta|comente|envie|mande)[^\n]*/gim, '')
    .replace(/^[^\n]*clique aqui[^\n]*/gim, '')
    .replace(/^[^\n]*siga o (novo )?canal[^\n]*/gim, '')
    .replace(/^[^\n]*no whatsapp[^\n]*$/gim, '')
    .replace(/^[^\n]*podcast ge[^\n]*/gim, '')
    .replace(/^[^\n]*tudo sobre .* no ge[^\n]*/gim, '')
    .replace(/^Assista:.*$/gim, '')
    .replace(/^Veja (abaixo|acima|aqui|os|a|o)[^\n]*:?\s*$/gim, '')
    .replace(/^Leia mais[^\n]*/gim, '')
    .replace(/^Mais notícias d[eao][^\n]*/gim, '')
    .replace(/—?\s*Foto:\s*[^\n]+/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .split('\n')
    .filter(line => {
      const l = line.trim();
      if (!l) return true;
      if (/^fonte\s*:/i.test(l)) return false;
      if (/https?:\/\//i.test(l)) return false;
      if (/ge\.globo\.com|\bglobo\.com\b|\bg1\b|globoplay|sportv/i.test(l)) return false;
      if (/^\s*Foto:\s*/i.test(l)) return false;
      if (/^(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre)\s/i.test(l)) return false;
      if (/whatsapp|telegram|instagram|twitter|facebook|youtube|tiktok/i.test(l) && l.length < 120) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Rewrite with AI
async function rewriteWithAI(title: string, content: string): Promise<{ rewrittenTitle: string; rewrittenContent: string }> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const prompt = `Você é um jornalista esportivo sênior da Fanaticamente. Produza um RESUMO ORIGINAL desta notícia com suas PRÓPRIAS PALAVRAS, apontando os principais detalhes. Não parafraseie frase a frase, não copie a estrutura do original.

REGRAS OBRIGATÓRIAS:
- Não copie frases nem trechos. Escreva um resumo jornalístico próprio (3 a 6 parágrafos curtos) destacando os fatos principais.
- Preserve TODOS os acentos, cedilhas e til (ex.: "reforço", "condições", "São Paulo").
- Nomes próprios sempre com inicial maiúscula em cada elemento: pessoas (Lautaro Díaz), clubes (Racing, Cruzeiro), países/cidades (Argentina), instituições, competições (Copa do Brasil, Libertadores).
- Título em "sentence case", apenas primeira letra maiúscula, exceto nomes próprios que sempre iniciam com maiúscula. Máx. 80 caracteres.
- PROIBIDO: emojis, instruções ao leitor (clique, siga, acesse, assine, vote, ouça, assista, confira, veja, leia, compartilhe), redes sociais, URLs, referências a Globo/ge/sportv/Cartola, timestamps, créditos de foto.

TÍTULO: ${title}
CONTEÚDO: ${content}

JSON: {"rewrittenTitle": "...", "rewrittenContent": "..."}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Jornalista esportivo. Reescreva com palavras diferentes. Responda APENAS em JSON válido.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI error: ${response.status}`);

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content || '';
  const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      rewrittenTitle: fixTitleCaps(parsed.rewrittenTitle || title, title),
      rewrittenContent: cleanContent(parsed.rewrittenContent || content),
    };
  }
  throw new Error('Failed to parse AI response');
}

function normalizeForCompare(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function fixTitleCaps(title: string, original: string): string {
  if (!title) return title;
  let fixed = title.charAt(0).toUpperCase() + title.slice(1);
  const caps = new Map<string, string>();
  for (const w of (original || '').split(/\s+/)) {
    const clean = w.replace(/[^\p{L}\p{M}\-]/gu, '');
    if (clean.length >= 2 && /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(clean)) {
      caps.set(normalizeForCompare(clean), clean);
    }
  }
  fixed = fixed.replace(/[\p{L}\p{M}\-]+/gu, (w) => caps.get(normalizeForCompare(w)) || w);
  return fixed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's articles
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { data: articles, error } = await supabase
      .from('football_news')
      .select('id, rewritten_title, rewritten_content, original_title, original_content, original_url, image_credits')
      .gte('published_at', `${todayStr}T00:00:00Z`);

    if (error) throw error;
    console.log(`Found ${articles?.length || 0} articles from today to re-process`);

    let fixed = 0;
    for (const article of articles || []) {
      try {
        const updateData: Record<string, unknown> = {};

        // Re-rewrite with AI using original content
        if (article.original_content && article.original_content.length > 100) {
          try {
            const { rewrittenTitle, rewrittenContent } = await rewriteWithAI(
              article.original_title,
              article.original_content
            );
            updateData.rewritten_title = rewrittenTitle;
            updateData.rewritten_content = rewrittenContent;
          } catch (aiErr) {
            console.log(`AI rewrite skipped for ${article.id}: ${aiErr}`);
            // Still clean existing content without AI
            const cleaned = cleanContent(article.rewritten_content);
            if (cleaned !== article.rewritten_content) updateData.rewritten_content = cleaned;
          }
        }

        // Fix missing image credits by re-fetching article page
        if (!article.image_credits && article.original_url) {
          try {
            const html = await fetchHtml(article.original_url);
            const { imageCredits, imageCaption } = extractImageCredits(html);
            if (imageCredits) updateData.image_credits = imageCredits;
            if (imageCaption) updateData.image_caption = imageCaption;
          } catch (e) {
            console.error(`Failed to fetch credits for ${article.original_url}:`, e);
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('football_news')
            .update(updateData)
            .eq('id', article.id);

          if (!updateError) {
            fixed++;
            console.log(`Fixed: ${(updateData.rewritten_title as string || article.rewritten_title).substring(0, 60)}...`);
          }
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.error(`Error processing article ${article.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: articles?.length || 0, fixed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error:', e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
