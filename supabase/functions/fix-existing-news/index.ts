import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fixTitleAndContent(title: string, content: string): Promise<{ fixedTitle: string; fixedContent: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um editor de notícias experiente. Corrija o título e o conteúdo seguindo rigorosamente as regras:

REGRAS DO TÍTULO:
1. Use "sentence case" - APENAS a primeira letra da primeira palavra em maiúscula
2. Nomes próprios DEVEM ter inicial maiúscula:
   - Nomes de pessoas (Neymar, Gabigol, Abel Ferreira, Messi)
   - Nomes de clubes por extenso (Flamengo, Palmeiras, Barcelona, Real Madrid)
   - Abreviações de clubes (CAM, Flu, São Paulo FC, PSG)
   - Cidades e países (São Paulo, Argentina, Londres, Brasil)
   - Competições (Brasileirão, Champions League, Libertadores, Copa do Brasil)
3. NUNCA use Title Case com múltiplas palavras comuns começando em maiúscula
4. Mantenha o tom jornalístico profissional
5. Remova pontuação excessiva (!!!, ???)

EXEMPLOS DE CORREÇÃO DE TÍTULOS:
- ERRADO: "Barcelona Despacha Copenhague e Carimba Vaga Direta nas Oitavas da Champions"
- CORRETO: "Barcelona despacha Copenhague e carimba vaga direta nas oitavas da Champions"

- ERRADO: "Hulk de Ferro: Cinco Anos de Glória e Artilharia Inesgotável no Atlético-MG"
- CORRETO: "Hulk de ferro: cinco anos de glória e artilharia inesgotável no Atlético-MG"

- ERRADO: "neymar volta ao santos depois de anos na europa"
- CORRETO: "Neymar volta ao Santos depois de anos na Europa"

REGRAS DO CONTEÚDO:
1. Use linguagem jornalística FORMAL e profissional
2. Remova expressões sensacionalistas como "O 'Special One'", "Show de bola", "O filho pródigo"
3. Evite gírias e coloquialismos
4. Use voz ativa e frases bem estruturadas
5. Mantenha os fatos, datas, placares e nomes corretos
6. Texto objetivo e informativo
7. Estrutura clara: lide no primeiro parágrafo, desenvolvimento nos demais

TÍTULO ATUAL:
${title}

CONTEÚDO ATUAL:
${content}

Responda EXATAMENTE neste formato JSON:
{
  "fixedTitle": "título corrigido aqui",
  "fixedContent": "conteúdo corrigido aqui"
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
        { role: 'system', content: 'Você é um editor de notícias experiente. Sempre responda em JSON válido.' },
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
        fixedTitle: parsed.fixedTitle || title,
        fixedContent: parsed.fixedContent || content,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { fixedTitle: title, fixedContent: content };
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

    // Get all news
    const { data: news, error: fetchError } = await supabase
      .from('football_news')
      .select('id, rewritten_title, rewritten_content, image_caption')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${news?.length || 0} articles to fix`);

    const fixed: string[] = [];

    for (const article of news || []) {
      try {
        console.log(`Fixing: ${article.rewritten_title}`);
        
        // Fix title and content with AI
        const { fixedTitle, fixedContent } = await fixTitleAndContent(
          article.rewritten_title,
          article.rewritten_content
        );
        
        // Fix caption
        const fixedCaption = fixCaption(article.image_caption);
        
        // Update in database
        const { error: updateError } = await supabase
          .from('football_news')
          .update({
            rewritten_title: fixedTitle,
            rewritten_content: fixedContent,
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
        await new Promise(resolve => setTimeout(resolve, 500));
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
