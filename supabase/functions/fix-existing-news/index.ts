import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        fixedContent: parsed.fixedContent || originalContent,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { fixedTitle: originalTitle, fixedContent: originalContent };
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
        
        // Fix title and content with AI - use original_content if available
        const { fixedTitle, fixedContent } = await rewriteFromOriginal(
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
