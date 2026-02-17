import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Club pages on ge.globo.com - reuse from news scraper
const CLUB_GE_URLS: Record<string, string> = {
  "athletico-pr": "https://ge.globo.com/pr/futebol/times/athletico-pr/",
  "atletico-mg": "https://ge.globo.com/futebol/times/atletico-mg/",
  "bahia": "https://ge.globo.com/ba/futebol/times/bahia/",
  "botafogo": "https://ge.globo.com/futebol/times/botafogo/",
  "bragantino": "https://ge.globo.com/sp/vale-do-paraiba-regiao/futebol/times/bragantino/",
  "corinthians": "https://ge.globo.com/futebol/times/corinthians/",
  "cruzeiro": "https://ge.globo.com/futebol/times/cruzeiro/",
  "flamengo": "https://ge.globo.com/futebol/times/flamengo/",
  "fluminense": "https://ge.globo.com/futebol/times/fluminense/",
  "gremio": "https://ge.globo.com/rs/futebol/times/gremio/",
  "internacional": "https://ge.globo.com/rs/futebol/times/internacional/",
  "mirassol": "https://ge.globo.com/sp/tem-esporte/futebol/times/mirassol/",
  "palmeiras": "https://ge.globo.com/futebol/times/palmeiras/",
  "santos": "https://ge.globo.com/futebol/times/santos/",
  "sao-paulo": "https://ge.globo.com/futebol/times/sao-paulo/",
  "vasco": "https://ge.globo.com/futebol/times/vasco/",
  "vitoria": "https://ge.globo.com/ba/futebol/times/vitoria/",
  "fortaleza": "https://ge.globo.com/ce/futebol/times/fortaleza/",
  "cuiaba": "https://ge.globo.com/mt/futebol/times/cuiaba/",
  "juventude": "https://ge.globo.com/rs/futebol/times/juventude/",
  "criciuma": "https://ge.globo.com/sc/futebol/times/criciuma/",
  "sport": "https://ge.globo.com/pe/futebol/times/sport/",
  "america-mg": "https://ge.globo.com/futebol/times/america-mg/",
  "ceara": "https://ge.globo.com/ce/futebol/times/ceara/",
  "goias": "https://ge.globo.com/go/futebol/times/goias/",
  "vila-nova": "https://ge.globo.com/go/futebol/times/vila-nova/",
  "novorizontino": "https://ge.globo.com/sp/tem-esporte/futebol/times/novorizontino/",
};

function logStep(step: string) {
  console.log(`[scrape-matches] ${step}`);
}

async function scrapeClubPage(url: string): Promise<string> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${url}?_t=${Date.now()}`,
      formats: ['markdown'],
      onlyMainContent: false,
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.data?.markdown || data.markdown || '';
}

async function extractMatchesWithAI(markdown: string, clubId: string, clubName: string): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const today = new Date().toISOString().split('T')[0];

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
          content: `Você é um extrator de dados de futebol. Extraia APENAS os próximos jogos agendados (não resultados passados) do clube "${clubName}" a partir do conteúdo markdown de uma página esportiva. A data de hoje é ${today}. Retorne um JSON no formato: { "matches": [{ "opponent": "Nome do adversário", "match_date": "YYYY-MM-DD", "match_time": "HH:MM" ou null, "competition": "Nome da competição" ou null, "is_home": true/false }] }. Se não encontrar jogos futuros, retorne { "matches": [] }. Considere APENAS jogos com data igual ou posterior a hoje.`
        },
        {
          role: 'user',
          content: `Extraia os próximos jogos do ${clubName} deste conteúdo:\n\n${markdown.substring(0, 8000)}`
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
    logStep(`Failed to parse AI response for ${clubId}`);
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
    
    // Verify user role
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
    const userRoles = (roles || []).map(r => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('developer')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Optional: scrape specific clubs only
    const body = await req.json().catch(() => ({}));
    const targetClubs: string[] = body.clubs || Object.keys(CLUB_GE_URLS);
    const maxClubs = Math.min(targetClubs.length, 5); // Limit to 5 per call to avoid timeout

    logStep(`Scraping matches for ${maxClubs} clubs...`);

    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < maxClubs; i++) {
      const clubId = targetClubs[i];
      const clubUrl = CLUB_GE_URLS[clubId];
      if (!clubUrl) {
        errors.push(`No URL for club: ${clubId}`);
        continue;
      }

      try {
        logStep(`Scraping ${clubId}...`);
        const markdown = await scrapeClubPage(clubUrl);
        
        if (!markdown || markdown.length < 100) {
          errors.push(`No content for ${clubId}`);
          continue;
        }

        // Get club name from DB
        const { data: clubData } = await adminClient
          .from('clubs')
          .select('name')
          .eq('id', clubId)
          .single();

        const clubName = clubData?.name || clubId;
        const matches = await extractMatchesWithAI(markdown, clubId, clubName);

        logStep(`Found ${matches.length} matches for ${clubId}`);

        for (const match of matches) {
          if (!match.opponent || !match.match_date) continue;

          // Upsert - avoid duplicates by club + date + opponent
          const { data: existing } = await adminClient
            .from('upcoming_matches')
            .select('id')
            .eq('club_id', clubId)
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
            results.push({ clubId, action: 'updated', match });
          } else {
            await adminClient.from('upcoming_matches').insert({
              club_id: clubId,
              opponent: match.opponent,
              match_date: match.match_date,
              match_time: match.match_time || null,
              competition: match.competition || null,
              is_home: match.is_home ?? true,
            });
            results.push({ clubId, action: 'inserted', match });
          }
        }

        // Small delay between clubs to avoid rate limiting
        if (i < maxClubs - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${clubId}: ${msg}`);
        logStep(`Error for ${clubId}: ${msg}`);
      }
    }

    // Clean old matches (past dates)
    const today = new Date().toISOString().split('T')[0];
    await adminClient
      .from('upcoming_matches')
      .delete()
      .lt('match_date', today);

    logStep(`Done. ${results.length} matches processed, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      matchesProcessed: results.length,
      results,
      errors,
      clubsScraped: maxClubs,
      remainingClubs: targetClubs.length - maxClubs,
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
