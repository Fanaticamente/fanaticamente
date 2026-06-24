import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_CLUB_IDS = [
  "athletico-pr", "atletico-mg", "bahia", "botafogo", "bragantino",
  "chapecoense", "corinthians", "coritiba", "cruzeiro", "flamengo",
  "fluminense", "gremio", "internacional", "mirassol", "palmeiras",
  "remo", "santos", "sao-paulo", "vasco", "vitoria",
  "america-mg", "athletic", "atletico-go", "avai", "botafogo-sp",
  "ceara", "crb", "criciuma", "cuiaba", "fortaleza", "goias",
  "juventude", "nautico", "novorizontino", "londrina", "operario-pr",
  "ponte-preta", "sao-bernardo", "sport", "vila-nova"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id);
    if (!(roles || []).some((r: any) => r.role === 'admin' || r.role === 'developer')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get articles without club_id
    const { data: articles, error } = await supabase
      .from('football_news')
      .select('id, rewritten_title, rewritten_content')
      .is('club_id', null)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0, message: 'No articles without club_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Found ${articles.length} articles without club_id`);

    // Build a single AI request for all articles
    const prompt = `Analise cada notícia abaixo e identifique o clube PRINCIPAL mencionado.
Use APENAS um destes IDs: ${VALID_CLUB_IDS.join(', ')}
Se a notícia for sobre futebol internacional ou não tiver clube específico, use null.

${articles.map((a, i) => `[${i}] "${a.rewritten_title}"\n${a.rewritten_content.slice(0, 200)}`).join('\n\n')}

Responda em JSON: [{"index": 0, "clubId": "flamengo"}, {"index": 1, "clubId": null}, ...]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você identifica clubes de futebol brasileiros em notícias. Responda apenas em JSON válido.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const results = JSON.parse(jsonMatch[0]);
    let updated = 0;

    for (const result of results) {
      const article = articles[result.index];
      if (!article || !result.clubId || !VALID_CLUB_IDS.includes(result.clubId)) continue;

      const { error: updateError } = await supabase
        .from('football_news')
        .update({ club_id: result.clubId })
        .eq('id', article.id);

      if (!updateError) {
        updated++;
        console.log(`Updated: "${article.rewritten_title}" -> ${result.clubId}`);
      }
    }

    return new Response(JSON.stringify({ success: true, updated, total: articles.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
