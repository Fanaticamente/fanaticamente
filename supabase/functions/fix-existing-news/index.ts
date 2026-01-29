import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeArticleMainContent(url: string): Promise<string> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const urlWithTimestamp = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: urlWithTimestamp,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 30000,
      skipTlsVerification: false,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error('Firecrawl scrape error:', response.status, t);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  const result = await response.json();
  const data = result.data || result;
  return String(data.markdown || '');
}

function cleanOriginalArticleText(input: string): string {
  // Aggressively remove boilerplate, navigation, metadata from scraped content
  
  // First, remove common markdown headers that are navigation/menu items
  let text = input
    .replace(/\r\n/g, '\n')
    // Remove navigation menu items (single words/short phrases as headings)
    .replace(/^#+\s*(TIMES|Série [AB]|Europa|Internacional|Brasileirão|Campeonatos?|Futebol|Notícias|Vídeos|Ao Vivo|Tabela|Classificação)\s*$/gim, '')
    // Remove "Por [Author] — [City]" lines
    .replace(/^Por\s+[A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú][a-zà-ú]+.*?—.*$/gim, '')
    // Remove timestamps like "29/01/2026 18h09 Atualizado há X minutos"
    .replace(/^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}h\d{2}.*$/gim, '')
    .replace(/^Atualizado há \d+.*$/gim, '')
    // Remove asterisk separators
    .replace(/^\*\s*\*\s*\*\s*$/gm, '')
    // Remove hashtag headers that are just menu items
    .replace(/^##+\s*[A-ZÀ-Ú][a-zà-ú]+\s+[a-zà-ú]+\s+[a-zà-ú]+\s*$/gim, '')
    // Remove empty lines with just whitespace
    .replace(/^\s+$/gm, '')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n');
  
  // Block patterns for entire paragraphs
  const blockedPatterns = [
    /navegue pelo conteúdo/i,
    /conta globo/i,
    /seja pro/i,
    /globoplay/i,
    /cartola/i,
    /gshow/i,
    /globocom/i,
    /\bg1\b/i,
    /assine|assinante|assinatura/i,
    /login unificad/i,
    /receber recomendações/i,
    /ofertas exclusivas/i,
    /clique para/i,
    /compartilhe no/i,
    /facebook|twitter|whatsapp|telegram/i,
    /saiba mais\s*$/i,
    /veja também/i,
    /leia mais/i,
    /PUBLICIDADE/i,
    /baixe o app/i,
    /^TIMES$/i,
    /^Série [AB]$/i,
    /^Europa$/i,
    /^#\s/,
    /^##\s/,
  ];

  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      // Skip very short paragraphs that are likely menu items (less than 20 chars)
      if (p.length < 20 && !p.includes('.')) return false;
      // Skip if matches blocked patterns
      if (blockedPatterns.some((re) => re.test(p))) return false;
      return true;
    });

  // Find where the actual article content starts (skip headers/navigation)
  let startIndex = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    // Actual article paragraphs are usually longer than 50 chars
    if (paragraphs[i].length > 50 && !paragraphs[i].startsWith('#')) {
      startIndex = i;
      break;
    }
  }

  return paragraphs.slice(startIndex).join('\n\n').trim();
}

function sanitizeRewrittenContent(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      if (/^fonte\s*:/i.test(l)) return false;
      if (/https?:\/\//i.test(l)) return false;
      if (/ge\.globo\.com|\bglobo\.com\b|\bg1\b|globoplay/i.test(l)) return false;
      return true;
    })
    .join('\n')
    .trim();
}

async function rewriteFromOriginal(originalTitle: string, originalContent: string): Promise<{ fixedTitle: string; fixedContent: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um jornalista esportivo sênior. Sua tarefa é REESCREVER esta notícia de forma COMPLETA.

⚠️ REGRAS ABSOLUTAS:
1. Use EXCLUSIVAMENTE informações do texto original - NÃO invente NADA
2. NÃO RESUMA - sua reescrita deve ter o MESMO tamanho ou MAIOR que o original
3. Mantenha TODOS os fatos, declarações, números e detalhes do original
4. Apenas REFORMULE as frases com palavras diferentes para evitar plágio
5. PROIBIDO incluir: "Fonte:", URLs, citações de site (Globo, ge.globo.com, g1, Globoplay) ou instruções de navegação/assinatura

REGRAS DO TÍTULO:
- Use "sentence case" (só primeira letra maiúscula)
- Nomes próprios em maiúscula: Neymar, Flamengo, Brasileirão, São Paulo
- Tom formal sem sensacionalismo

REGRAS DO CONTEÚDO:
1. REESCREVA cada parágrafo do original com palavras diferentes
2. MANTENHA todas as declarações entre aspas (reformule a introdução, não a fala)
3. PRESERVE todos os números, datas, valores e estatísticas exatamente como estão
4. INCLUA todos os nomes de pessoas, clubes e competições mencionados
5. NÃO ADICIONE contexto, história ou informações que não estejam no original
6. O texto final deve ter entre 400-800 palavras
7. Use linguagem jornalística formal (estilo Folha de S.Paulo)

EXEMPLO DE REESCRITA CORRETA:
Original: "O Flamengo anunciou a contratação de João Silva por R$ 10 milhões. 'Estou muito feliz', disse o jogador."
Reescrito: "O Rubro-Negro carioca oficializou a chegada do atleta João Silva em negociação avaliada em R$ 10 milhões. 'Estou muito feliz', declarou o reforço."

TÍTULO ORIGINAL:
${originalTitle}

CONTEÚDO ORIGINAL COMPLETO (REESCREVA TUDO, NÃO RESUMA):
${originalContent}

Responda em JSON:
{
  "fixedTitle": "título reformulado em sentence case",
  "fixedContent": "texto COMPLETO reformulado com todas as informações do original"
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Você é um jornalista esportivo experiente. Use APENAS informações do texto fornecido. Sempre responda em JSON válido.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content || '';
  
  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        fixedTitle: parsed.fixedTitle || originalTitle,
        fixedContent: sanitizeRewrittenContent(parsed.fixedContent || originalContent),
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { fixedTitle: originalTitle, fixedContent: sanitizeRewrittenContent(originalContent) };
}

function fixCaption(caption: string | null): string | null {
  if (!caption) return null;
  
  // Remove video metadata patterns
  // Pattern: "Something | Something | Something" - likely video metadata
  if (caption.includes('|')) {
    return null;
  }
  
  // Pattern: "1 de 2 ..." - slide indicator
  if (caption.match(/^\d+ de \d+/)) {
    return null;
  }
  
  // Pattern: "Arraste a seta..." - interaction instructions
  if (caption.toLowerCase().includes('arraste')) {
    return null;
  }
  
  // Remove action descriptions - keep only the person's name
  const actionPatterns = [
    / vive .*/i,
    / está .*/i,
    / faz .*/i,
    / durante .*/i,
    / em partida .*/i,
    / em treino .*/i,
    / em entrevista .*/i,
    / no jogo .*/i,
    / na partida .*/i,
    / após .*/i,
    / antes .*/i,
    / comemora .*/i,
    / celebra .*/i,
    / disputa .*/i,
    / treina .*/i,
    / participa .*/i,
    / para o ge.*/i,
    / momento .*/i,
    / concede .*/i,
    / fala .*/i,
    / conversa .*/i,
  ];
  
  let cleanedCaption = caption;
  for (const pattern of actionPatterns) {
    cleanedCaption = cleanedCaption.replace(pattern, '');
  }
  cleanedCaption = cleanedCaption.trim();
  
  // If it's just a team name like "Arsenal", remove it
  if (cleanedCaption.length < 5) {
    return null;
  }
  
  return cleanedCaption;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching existing news to fix...');

    const { limit } = await req.json().catch(() => ({ limit: 50 }));

    // Get recent news rows to fix (default 50)
    const { data: news, error: fetchError } = await supabase
      .from('football_news')
      .select('id, original_url, original_title, original_content, rewritten_title, rewritten_content, image_caption')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${news?.length || 0} articles to fix`);

    const fixed: string[] = [];

    for (const article of (news || []).slice(0, Math.max(1, Math.min(200, Number(limit) || 50)))) {
      try {
        console.log(`Fixing: ${article.original_title || article.rewritten_title}`);

        // Always re-scrape the source URL to avoid propagating previously-bad content.
        let scraped = '';
        try {
          scraped = await scrapeArticleMainContent(article.original_url);
        } catch (e) {
          console.error('Failed to re-scrape, falling back to stored original_content:', article.original_url, e);
          scraped = article.original_content || '';
        }

        const cleanedOriginal = cleanOriginalArticleText(scraped).slice(0, 16000);

        const { fixedTitle, fixedContent } = await rewriteFromOriginal(
          article.original_title || article.rewritten_title,
          cleanedOriginal
        );
        
        // Fix caption
        const fixedCaption = fixCaption(article.image_caption);
        
        // Update in database
        const { error: updateError } = await supabase
          .from('football_news')
          .update({
            rewritten_title: fixedTitle,
            rewritten_content: fixedContent,
            original_content: cleanedOriginal || article.original_content,
            image_caption: fixedCaption,
          })
          .eq('id', article.id);

        if (updateError) {
          console.error('Update error:', updateError);
        } else {
          fixed.push(article.id);
          console.log(`Fixed: ${fixedTitle}`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 650));
      } catch (error) {
        console.error(`Error fixing article ${article.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        fixed: fixed.length,
        ids: fixed 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fix error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
