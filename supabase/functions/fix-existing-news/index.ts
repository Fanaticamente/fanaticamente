import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function cleanContent(text: string): string {
  let cleaned = text
    .replace(/\r\n/g, '\n')
    // Remove emoji + CTA lines
    .replace(/[✅🗞️🎧📺📲👉🔗➡️⬇️]\s*[^\n]*/g, '')
    // Remove "+ CTA" lines
    .replace(/^\+\s*[^\n]*(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre|entre|compartilhe|curta|comente|envie|mande)[^\n]*/gim, '')
    // Remove specific CTA patterns
    .replace(/^[^\n]*clique aqui[^\n]*/gim, '')
    .replace(/^[^\n]*siga o (novo )?canal[^\n]*/gim, '')
    .replace(/^[^\n]*no whatsapp[^\n]*$/gim, '')
    .replace(/^[^\n]*podcast ge[^\n]*/gim, '')
    .replace(/^[^\n]*tudo sobre .* no ge[^\n]*/gim, '')
    .replace(/^[^\n]*o mercado do cartola[^\n]*/gim, '')
    .replace(/^Assista:.*$/gim, '')
    .replace(/^Veja (abaixo|acima|aqui|os|a|o)[^\n]*:?\s*$/gim, '')
    .replace(/^Lembra como foi[^\n]*\?[^\n]*(Veja|Confira|Assista)[^\n]*/gim, '')
    .replace(/^Mais notícias d[eao][^\n]*/gim, '')
    .replace(/^Leia mais[^\n]*/gim, '')
    .replace(/^Contratações d[eao][^\n]*quem (chega|sai|fica)[^\n]*/gim, '')
    .replace(/—?\s*Foto:\s*[^\n]+/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^Há\s+\d+\s+(minuto|hora|segundo|dia)s?\s*[a-záàâãéèêíïóôõöúç\s]*$/gim, '')
    .replace(/^Acompanhe a cobertura.*$/gim, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '');

  cleaned = cleaned
    .split('\n')
    .filter(line => {
      const l = line.trim();
      if (!l) return true;
      if (/^fonte\s*:/i.test(l)) return false;
      if (/https?:\/\//i.test(l)) return false;
      if (/ge\.globo\.com|\bglobo\.com\b|\bg1\b|globoplay|sportv/i.test(l)) return false;
      if (/^\s*Foto:\s*/i.test(l)) return false;
      if (/^(TIMES|Série [AB]|Europa|Internacional|Brasileirão)$/i.test(l)) return false;
      if (/^\s*\+\s*$/i.test(l)) return false;
      if (/^(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre)\s/i.test(l)) return false;
      if (/whatsapp|telegram|instagram|twitter|facebook|youtube|tiktok/i.test(l) && l.length < 120) return false;
      if (/^(flamengo|corinthians|palmeiras|são paulo|santos|vasco|botafogo|fluminense|grêmio|internacional|atlético-mg|cruzeiro|bahia|fortaleza|sport|coritiba)\s*$/i.test(l)) return false;
      return true;
    })
    .join('\n')
    .split('\n')
    .filter((line, index, arr) => index === 0 || line.trim().toLowerCase() !== arr[index - 1].trim().toLowerCase())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
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
      .select('id, rewritten_title, rewritten_content')
      .gte('published_at', `${todayStr}T00:00:00Z`);

    if (error) throw error;

    console.log(`Found ${articles?.length || 0} articles from today to clean`);

    let cleaned = 0;
    for (const article of articles || []) {
      const cleanedContent = cleanContent(article.rewritten_content);
      const cleanedTitle = article.rewritten_title
        .replace(/[✅🗞️🎧📺📲👉🔗➡️⬇️]/g, '')
        .trim();

      if (cleanedContent !== article.rewritten_content || cleanedTitle !== article.rewritten_title) {
        const { error: updateError } = await supabase
          .from('football_news')
          .update({
            rewritten_content: cleanedContent,
            rewritten_title: cleanedTitle,
          })
          .eq('id', article.id);

        if (!updateError) {
          cleaned++;
          console.log(`Cleaned article: ${cleanedTitle.substring(0, 60)}...`);
        } else {
          console.error(`Error updating ${article.id}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: articles?.length || 0, cleaned }),
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
