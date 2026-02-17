import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AGENDA_URL = "https://ge.globo.com/agenda/#/futebol";

function logStep(step: string) {
  console.log(`[scrape-matches] ${step}`);
}

async function scrapeAgendaPage(): Promise<string> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: AGENDA_URL,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 5000, // Wait for SPA to render
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.data?.markdown || data.markdown || '';
}

async function extractMatchesWithAI(
  markdown: string,
  clubsList: { id: string; name: string }[]
): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const today = new Date().toISOString().split('T')[0];

  // Build a mapping of club names for the AI
  const clubNamesMap = clubsList.map(c => `"${c.name}" (id: "${c.id}")`).join(', ');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Você é um extrator de dados de futebol. A partir da agenda de jogos do dia no ge.globo.com, extraia TODOS os jogos listados.

CLUBES CADASTRADOS NO SISTEMA (use EXATAMENTE estes IDs quando o time corresponder):
${clubNamesMap}

Para cada jogo encontrado, identifique se algum dos dois times corresponde a um clube cadastrado. Se sim, gere uma entrada para CADA clube cadastrado envolvido nesse jogo (ou seja, se dois clubes cadastrados jogam entre si, gere DUAS entradas, uma para cada).

A data de hoje é ${today}.

Retorne um JSON no formato:
{
  "matches": [
    {
      "club_id": "id-do-clube-cadastrado",
      "opponent": "Nome do adversário (o outro time)",
      "match_date": "${today}",
      "match_time": "HH:MM" ou null,
      "competition": "Nome da competição" ou null,
      "is_home": true/false (true se o clube cadastrado é mandante)
    }
  ]
}

Se não encontrar jogos envolvendo clubes cadastrados, retorne { "matches": [] }.
Use variações de nomes (ex: "Athletico-PR" = "athletico-pr", "São Paulo" = "sao-paulo", "Grêmio" = "gremio", "Vasco" = "vasco", "Inter" ou "Internacional" = "internacional").`
        },
        {
          role: 'user',
          content: `Extraia os jogos de hoje desta agenda:\n\n${markdown.substring(0, 12000)}`
        }
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logStep(`OpenAI error: ${text}`);
    return [];
  }

  const data = await response.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.matches || [];
  } catch {
    logStep(`Failed to parse AI response`);
    return [];
  }
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

    logStep('Scraping agenda page...');

    // 1. Get all clubs from DB
    const { data: clubs } = await adminClient.from('clubs').select('id, name');
    if (!clubs || clubs.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No clubs in database' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Scrape the agenda page (single request)
    const markdown = await scrapeAgendaPage();
    logStep(`Got ${markdown.length} chars from agenda`);

    if (!markdown || markdown.length < 50) {
      return new Response(JSON.stringify({ success: false, error: 'No content from agenda page', markdownLength: markdown.length }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Extract matches with AI, passing our club list
    const matches = await extractMatchesWithAI(markdown, clubs);
    logStep(`AI found ${matches.length} matches involving registered clubs`);

    // 4. Upsert matches
    const results: any[] = [];
    for (const match of matches) {
      if (!match.club_id || !match.opponent || !match.match_date) continue;

      // Verify the club_id exists in our DB
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
    const today = new Date().toISOString().split('T')[0];
    await adminClient
      .from('upcoming_matches')
      .delete()
      .lt('match_date', today);

    logStep(`Done. ${results.length} matches processed.`);

    return new Response(JSON.stringify({
      success: true,
      matchesProcessed: results.length,
      results,
      markdownLength: markdown.length,
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
