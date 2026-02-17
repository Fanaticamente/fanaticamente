import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function logStep(step: string) {
  console.log(`[scrape-matches] ${step}`);
}

// Fetch raw HTML using native fetch
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

// Extract match data from HTML using Lovable AI
async function extractMatchesWithAI(
  html: string,
  clubsList: { id: string; name: string }[]
): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const today = new Date().toISOString().split('T')[0];
  const clubNamesMap = clubsList.map(c => `"${c.name}" (id: "${c.id}")`).join(', ');

  // Extract only text content from the HTML to reduce token usage
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 15000);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Você é um extrator de dados de futebol. Extraia TODOS os jogos listados na agenda.

CLUBES CADASTRADOS NO SISTEMA:
${clubNamesMap}

Para cada jogo, identifique se algum dos dois times corresponde a um clube cadastrado. Se sim, gere uma entrada para CADA clube cadastrado envolvido.

A data de hoje é ${today}.

Retorne um JSON no formato:
{
  "matches": [
    {
      "club_id": "id-do-clube-cadastrado",
      "opponent": "Nome do adversário",
      "match_date": "${today}",
      "match_time": "HH:MM" ou null,
      "competition": "Nome da competição" ou null,
      "is_home": true/false
    }
  ]
}

Se não encontrar jogos envolvendo clubes cadastrados, retorne { "matches": [] }.
Use variações de nomes (ex: "Athletico-PR" = "athletico-pr", "São Paulo" = "sao-paulo", "Grêmio" = "gremio").`
        },
        {
          role: 'user',
          content: `Extraia os jogos desta agenda:\n\n${textContent}`
        }
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logStep(`AI error: ${text}`);
    return [];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.matches || [];
    }
  } catch {
    logStep(`Failed to parse AI response`);
  }
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - admin or developer only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await adminClient.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('developer')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Fetching agenda page with native fetch...');

    // 1. Get all clubs from DB
    const { data: clubs } = await adminClient.from('clubs').select('id, name');
    if (!clubs || clubs.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No clubs in database' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch the agenda page using native fetch
    const html = await fetchHtml('https://ge.globo.com/agenda/#/futebol');
    logStep(`Got ${html.length} chars from agenda`);

    if (!html || html.length < 100) {
      return new Response(JSON.stringify({ success: false, error: 'No content from agenda page', htmlLength: html.length }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Extract matches with AI
    const matches = await extractMatchesWithAI(html, clubs);
    logStep(`AI found ${matches.length} matches involving registered clubs`);

    // 4. Upsert matches
    const results: any[] = [];
    for (const match of matches) {
      if (!match.club_id || !match.opponent || !match.match_date) continue;

      const validClub = clubs.find((c: any) => c.id === match.club_id);
      if (!validClub) {
        logStep(`Skipping unknown club_id: ${match.club_id}`);
        continue;
      }

      const { data: existing } = await adminClient
        .from('upcoming_matches')
        .select('id')
        .eq('club_id', match.club_id)
        .eq('match_date', match.match_date)
        .eq('opponent', match.opponent)
        .maybeSingle();

      if (existing) {
        await adminClient
          .from('upcoming_matches')
          .update({
            match_time: match.match_time || null,
            competition: match.competition || null,
            is_home: match.is_home ?? true,
          })
          .eq('id', existing.id);
        results.push({ club_id: match.club_id, action: 'updated', opponent: match.opponent });
      } else {
        await adminClient.from('upcoming_matches').insert({
          club_id: match.club_id,
          opponent: match.opponent,
          match_date: match.match_date,
          match_time: match.match_time || null,
          competition: match.competition || null,
          is_home: match.is_home ?? true,
        });
        results.push({ club_id: match.club_id, action: 'inserted', opponent: match.opponent });
      }
    }

    // 5. Clean old matches
    const todayStr = new Date().toISOString().split('T')[0];
    await adminClient
      .from('upcoming_matches')
      .delete()
      .lt('match_date', todayStr);

    logStep(`Done. ${results.length} matches processed.`);

    return new Response(JSON.stringify({
      success: true,
      matchesProcessed: results.length,
      results,
      htmlLength: html.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logStep(`Fatal error: ${msg}`);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
