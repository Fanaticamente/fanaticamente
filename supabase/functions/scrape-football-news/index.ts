import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NewsItem {
  url: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  sourceSite: string;
  clubId?: string;
}

// Mapping of club IDs to ge.globo.com URLs for Série A and B
const CLUB_GE_URLS: Record<string, string> = {
  // Série A
  "athletico-pr": "https://ge.globo.com/pr/futebol/times/athletico-pr/",
  "atletico-mg": "https://ge.globo.com/futebol/times/atletico-mg/",
  "bahia": "https://ge.globo.com/ba/futebol/times/bahia/",
  "botafogo": "https://ge.globo.com/futebol/times/botafogo/",
  "bragantino": "https://ge.globo.com/sp/vale-do-paraiba-regiao/futebol/times/bragantino/",
  "chapecoense": "https://ge.globo.com/sc/futebol/times/chapecoense/",
  "corinthians": "https://ge.globo.com/futebol/times/corinthians/",
  "coritiba": "https://ge.globo.com/pr/futebol/times/coritiba/",
  "cruzeiro": "https://ge.globo.com/futebol/times/cruzeiro/",
  "flamengo": "https://ge.globo.com/futebol/times/flamengo/",
  "fluminense": "https://ge.globo.com/futebol/times/fluminense/",
  "gremio": "https://ge.globo.com/rs/futebol/times/gremio/",
  "internacional": "https://ge.globo.com/rs/futebol/times/internacional/",
  "mirassol": "https://ge.globo.com/sp/tem-esporte/futebol/times/mirassol/",
  "palmeiras": "https://ge.globo.com/futebol/times/palmeiras/",
  "remo": "https://ge.globo.com/pa/futebol/times/remo/",
  "santos": "https://ge.globo.com/sp/santos-e-regiao/futebol/times/santos/",
  "sao-paulo": "https://ge.globo.com/futebol/times/sao-paulo/",
  "vasco": "https://ge.globo.com/futebol/times/vasco/",
  "vitoria": "https://ge.globo.com/ba/futebol/times/vitoria/",
  // Série B
  "america-mg": "https://ge.globo.com/futebol/times/america-mg/",
  "athletic": "https://ge.globo.com/mg/zona-da-mata-centro-oeste/futebol/times/athletic-club/",
  "atletico-go": "https://ge.globo.com/go/futebol/times/atletico-go/",
  "avai": "https://ge.globo.com/go/futebol/times/avai/",
  "botafogo-sp": "https://ge.globo.com/sp/ribeirao-preto-e-regiao/futebol/times/botafogo-sp/",
  "ceara": "https://ge.globo.com/ce/futebol/times/ceara/",
  "crb": "https://ge.globo.com/al/futebol/times/crb/",
  "criciuma": "https://ge.globo.com/al/futebol/times/criciuma/",
  "cuiaba": "https://ge.globo.com/al/futebol/times/cuiaba/",
  "fortaleza": "https://ge.globo.com/al/futebol/times/fortaleza/",
  "goias": "https://ge.globo.com/al/futebol/times/goias/",
  "juventude": "https://ge.globo.com/al/futebol/times/juventude/",
  "nautico": "https://ge.globo.com/al/futebol/times/nautico/",
  "novorizontino": "https://ge.globo.com/sp/tem-esporte/futebol/times/novorizontino/",
  "londrina": "https://ge.globo.com/sp/tem-esporte/futebol/times/londrina/",
  "operario-pr": "https://ge.globo.com/pr/futebol/times/operario-pr/",
  "ponte-preta": "https://ge.globo.com/sp/campinas-e-regiao/futebol/times/ponte-preta/",
  "sao-bernardo": "https://ge.globo.com/sp/futebol/times/sao-bernardo/",
  "sport": "https://ge.globo.com/pe/futebol/times/sport/",
  "vila-nova": "https://ge.globo.com/go/futebol/times/vila-nova/",
};

// Fetch raw HTML from a URL using native fetch
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  return response.text();
}

// Extract article URLs from an HTML page
function extractArticleUrls(html: string, clubId?: string, skipDateFilter = false): NewsItem[] {
  const news: NewsItem[] = [];
  const seenUrls = new Set<string>();

  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;

  // Extract hrefs matching news article pattern
  const hrefPattern = /href="(https:\/\/ge\.globo\.com\/[^"]*\/noticia\/[^"]*\.ghtml)"/g;
  let match;
  while ((match = hrefPattern.exec(html)) !== null && news.length < 25) {
    const url = match[1].split('?')[0];
    if (seenUrls.has(url)) continue;

    // Only recent articles (skip filter for targeted scrapes)
    if (!skipDateFilter && !url.includes(`/noticia/${today}/`) && !url.includes(`/noticia/${yesterdayStr}/`)) continue;
    // Skip non-article pages
    if (url.includes('/jogo/') || url.includes('/ao-vivo/') || url.includes('/video/')) continue;
    if (!url.includes('/futebol/')) continue;

    seenUrls.add(url);

    const pathMatch = url.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
    if (pathMatch) {
      const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
      news.push({ url, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com', clubId });
    }
  }

  return news;
}

// Extract article content, image, and publication date from article HTML
function extractArticleDetails(html: string, url: string): {
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  imageCredits?: string;
  publishedAt?: Date;
  isRecent: boolean;
} {
  // Extract main text content from article body
  // GE uses <p class="content-text__container"> for article paragraphs
  const paragraphs: string[] = [];
  const pPattern = /<p[^>]*class="[^"]*content-text[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pPattern.exec(html)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 20) paragraphs.push(text);
  }

  // Fallback: extract from <article> or generic <p> tags
  if (paragraphs.length === 0) {
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const section = articleMatch ? articleMatch[1] : html;
    const genericP = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((pMatch = genericP.exec(section)) !== null) {
      const text = pMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 40) paragraphs.push(text);
    }
  }

  const content = paragraphs.join('\n\n').slice(0, 16000);

  // Extract og:image
  let imageUrl: string | undefined;
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImageMatch) imageUrl = ogImageMatch[1];

  // Extract image caption AND credits from figcaption
  let imageCaption: string | undefined;
  let imageCredits: string | undefined;
  const figcaptionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  if (figcaptionMatch) {
    const raw = figcaptionMatch[1].replace(/<[^>]+>/g, '').trim();
    if (raw.includes('—')) {
      const parts = raw.split('—');
      const captionPart = parts[0].trim();
      const creditPart = parts.slice(1).join('—').trim();
      if (captionPart) imageCaption = captionPart;
      if (creditPart) imageCredits = creditPart;
    } else if (raw.startsWith('Foto:')) {
      imageCredits = raw;
    } else {
      imageCaption = raw;
    }
  }

  // Extract publication date
  let publishedAt: Date | undefined;
  const dateMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i) ||
                    html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (dateMatch) publishedAt = new Date(dateMatch[1]);

  let isRecent = false;
  if (publishedAt && !isNaN(publishedAt.getTime())) {
    const hoursSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    isRecent = hoursSince <= 6;
  } else {
    const today = new Date();
    const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    isRecent = url.includes(`/noticia/${todayStr}/`);
  }

  return { content, imageUrl, imageCaption, imageCredits, publishedAt, isRecent };
}

// Sanitize rewritten content
function sanitizeRewrittenContent(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    // Strip ALL emojis / pictographs
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, '')
    // Common GE promo lines
    .replace(/^[^\n]*adicione o ge[^\n]*/gim, '')
    .replace(/^[^\n]*fontes favoritas do google[^\n]*/gim, '')
    .replace(/^\s*\+\s*[^\n]*$/gim, '')
    .replace(/—?\s*Foto:\s*[^\n]+/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^Há\s+\d+\s+(minuto|hora|segundo|dia)s?\s*[a-záàâãéèêíïóôõöúç\s]*$/gim, '')
    .replace(/Há\s+\d+\s+(minuto|hora|segundo|dia)s?\s+[a-záàâãéèêíïóôõöúç\s]+/gi, '')
    .replace(/^Acompanhe a cobertura.*$/gim, '')
    .replace(/^(flamengo|corinthians|palmeiras|são paulo|santos|vasco|botafogo|fluminense|grêmio|internacional|atlético-mg|cruzeiro|bahia|fortaleza|sport|coritiba|futebol internacional|gato mestre|brasileirão)\s*$/gim, '')
    // Remove CTAs and navigation instructions
    .replace(/[✅🗞️🎧📺📲👉🔗➡️⬇️]\s*[^\n]*(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre|entre|compartilhe|curta|comente|envie|mande|responda)[^\n]*/gi, '')
    .replace(/^\+\s*[^\n]*(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira aqui|veja (abaixo|acima|aqui)|leia mais|monte seu|cadastre|entre no|compartilhe|curta|comente|envie|mande)[^\n]*/gim, '')
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
    .split('\n')
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      if (/^fonte\s*:/i.test(l)) return false;
      if (/https?:\/\//i.test(l)) return false;
      if (/ge\.globo\.com|\bglobo\.com\b|\bg1\b|globoplay/i.test(l)) return false;
      if (/^\s*Foto:\s*/i.test(l)) return false;
      if (/^(TIMES|Série [AB]|Europa|Internacional|Brasileirão)$/i.test(l)) return false;
      // Remove lines that are just CTAs or promotional
      if (/^\s*\+\s*$/i.test(l)) return false;
      if (/^(clique|siga|acesse|inscreva|assine|baixe|vote|participe|ouça|assista|acompanhe|confira|veja|leia|monte|cadastre)\s/i.test(l)) return false;
      if (/whatsapp|telegram|instagram|twitter|facebook|youtube|tiktok/i.test(l) && l.length < 120) return false;
      return true;
    })
    .join('\n')
    .split('\n')
    .filter((line, index, arr) => index === 0 || line.trim().toLowerCase() !== arr[index - 1].trim().toLowerCase())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Deep clean text
function deepCleanText(text: string): string {
  let cleaned = sanitizeRewrittenContent(text);
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .split('\n')
    .filter(line => {
      const l = line.trim().toLowerCase();
      if (l.length < 15 && !l.includes('.') && !l.includes('!') && !l.includes('?')) {
        if (!/^["']/.test(l) && !/[a-z],$/.test(l)) return false;
      }
      return true;
    })
    .join('\n')
    .split(/\n\s*\n/)
    .filter((para, index, arr) => {
      const normalized = para.trim().toLowerCase();
      return arr.findIndex(p => p.trim().toLowerCase() === normalized) === index;
    })
    .join('\n\n')
    .trim();
  return cleaned;
}

// Normalize a string for accent-insensitive comparison
function normalizeForCompare(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Fix title capitalization: ensure first letter is uppercase and proper nouns are capitalized.
// If `original` is provided, any word that was capitalized in the original title will also be capitalized here.
function fixTitleCapitalization(title: string, original?: string): string {
  if (!title || title.length === 0) return title;
  
  const properNouns: Record<string, string> = {
    'flamengo': 'Flamengo', 'corinthians': 'Corinthians', 'palmeiras': 'Palmeiras',
    'santos': 'Santos', 'vasco': 'Vasco', 'botafogo': 'Botafogo', 'fluminense': 'Fluminense',
    'grêmio': 'Grêmio', 'gremio': 'Grêmio', 'internacional': 'Internacional',
    'atlético-mg': 'Atlético-MG', 'atletico-mg': 'Atlético-MG', 'cruzeiro': 'Cruzeiro',
    'bahia': 'Bahia', 'fortaleza': 'Fortaleza', 'ceará': 'Ceará', 'ceara': 'Ceará',
    'sport': 'Sport', 'vitória': 'Vitória', 'vitoria': 'Vitória',
    'athletico-pr': 'Athletico-PR', 'athletico': 'Athletico', 'coritiba': 'Coritiba',
    'bragantino': 'Bragantino', 'mirassol': 'Mirassol', 'remo': 'Remo',
    'são paulo': 'São Paulo', 'sao paulo': 'São Paulo', 'são-paulo': 'São Paulo',
    'chapecoense': 'Chapecoense', 'juventude': 'Juventude', 'cuiabá': 'Cuiabá', 'cuiaba': 'Cuiabá',
    'goiás': 'Goiás', 'goias': 'Goiás', 'américa-mg': 'América-MG', 'america-mg': 'América-MG',
    'atlético-go': 'Atlético-GO', 'atletico-go': 'Atlético-GO',
    'criciúma': 'Criciúma', 'criciuma': 'Criciúma', 'novorizontino': 'Novorizontino',
    'vila nova': 'Vila Nova', 'ponte preta': 'Ponte Preta', 'operário-pr': 'Operário-PR',
    'londrina': 'Londrina', 'náutico': 'Náutico', 'nautico': 'Náutico',
    'avaí': 'Avaí', 'avai': 'Avaí', 'botafogo-sp': 'Botafogo-SP',
    'são bernardo': 'São Bernardo', 'sao bernardo': 'São Bernardo',
    'brasileirão': 'Brasileirão', 'brasileirao': 'Brasileirão',
    'libertadores': 'Libertadores', 'sul-americana': 'Sul-Americana',
    'copa do brasil': 'Copa do Brasil', 'série a': 'Série A', 'serie a': 'Série A',
    'série b': 'Série B', 'serie b': 'Série B',
    'champions league': 'Champions League', 'premier league': 'Premier League',
    'la liga': 'La Liga', 'copa américa': 'Copa América',
    'real madrid': 'Real Madrid', 'barcelona': 'Barcelona', 'manchester': 'Manchester',
    'shakhtar': 'Shakhtar', 'conmebol': 'CONMEBOL', 'cbf': 'CBF', 'fifa': 'FIFA',
    'var': 'VAR', 'crb': 'CRB',
  };

  let fixed = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Sort by length descending so longer matches take priority (e.g., "são paulo" before "paulo")
  const sortedEntries = Object.entries(properNouns).sort((a, b) => b[0].length - a[0].length);
  
  for (const [lower, correct] of sortedEntries) {
    const escaped = lower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[\\s,;:."'(])${escaped}(?=$|[\\s,;:."')])`, 'gi');
    fixed = fixed.replace(regex, correct);
  }
  
  // Capitalize first letter after ": " or ". "
  fixed = fixed.replace(/([:.])\s+([a-záàâãéèêíïóôõöúç])/g, (_, punct, letter) => {
    return `${punct} ${letter.toUpperCase()}`;
  });

  // Preserve capitalization of proper nouns present in the ORIGINAL title.
  if (original) {
    const originalCaps = new Map<string, string>();
    for (const w of original.split(/\s+/)) {
      const clean = w.replace(/[^\p{L}\p{M}\-]/gu, '');
      if (clean.length < 2) continue;
      if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(clean)) {
        originalCaps.set(normalizeForCompare(clean), clean);
      }
    }
    fixed = fixed.replace(/[\p{L}\p{M}\-]+/gu, (word) => {
      const key = normalizeForCompare(word);
      const match = originalCaps.get(key);
      if (match) return match; // use the original casing/accents
      return word;
    });
  }

  return fixed;
}

// Valid club IDs for identification
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

// Rewrite article with Lovable AI
async function rewriteWithAI(title: string, content: string): Promise<{ rewrittenTitle: string; rewrittenContent: string; shouldSkip: boolean; detectedClubId?: string }> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const prompt = `Você é um jornalista esportivo sênior da Fanaticamente. Sua tarefa é PRODUZIR UM RESUMO ORIGINAL da notícia, apontando os principais detalhes com SUAS PRÓPRIAS PALAVRAS. Não parafraseie frase a frase, não copie a estrutura do original.

⚠️ REGRA ANTI-PLÁGIO (MAIS IMPORTANTE):
- NÃO copie frases nem trechos do texto original. Escreva um resumo próprio, jornalístico, destacando os fatos principais (o que aconteceu, quem, quando, onde, valores, próximos passos).
- Use vocabulário e estrutura diferentes. O texto final não pode ter mais de 20% de semelhança textual com o original.
- Tamanho: 3 a 6 parágrafos curtos. Prefira menos texto e mais clareza.

⚠️ ORTOGRAFIA E NOMES PRÓPRIOS (OBRIGATÓRIO):
- Preserve TODOS os acentos gráficos, cedilhas e til (ex.: "reforço", "condições", "São Paulo", "Grêmio", "Atlético").
- TODOS os nomes próprios levam inicial maiúscula em CADA elemento: pessoas (Lautaro Díaz, Juan Pablo Vojvoda), clubes (Racing, Cruzeiro, Santos), países/cidades (Argentina, Independiente del Valle), instituições, competições (Copa do Brasil, Libertadores), eventos e datas históricas.
- Nunca escreva nomes próprios em minúsculas, mesmo no meio da frase.

⚠️ REGRAS DE PROIBIÇÃO ABSOLUTA NO TEXTO FINAL:
1. JAMAIS inclua qualquer instrução ao leitor: "clique aqui", "siga o canal", "acesse", "assine", "vote", "participe", "ouça o podcast", "assista", "confira", "veja abaixo/acima", "leia mais", "monte seu time", "cadastre-se", "entre no grupo", "compartilhe", "curta", "comente"
2. JAMAIS inclua emojis
3. JAMAIS inclua referências a redes sociais, WhatsApp, Instagram, Twitter, Telegram, YouTube, TikTok
4. JAMAIS inclua timestamps, créditos de foto, nomes de seções
5. JAMAIS inclua URLs, links, markdown, referências ao ge.globo.com, Globo, Globoplay, sportv, Cartola
6. JAMAIS inclua linhas promocionais ou listas de links

⚠️ REGRAS DE CONTEÚDO:
1. Use EXCLUSIVAMENTE informações factuais do texto original - NÃO invente NADA
2. Mantenha TODOS os fatos, declarações diretas (entre aspas), números e detalhes
3. A reescrita deve ter tamanho similar ao original
4. O texto deve conter APENAS conteúdo jornalístico puro

PRIMEIRO, ANALISE SE DEVE IGNORAR:
- Se o conteúdo for apenas enquete, quiz, votação, ou promoção sem notícia real: {"shouldSkip": true}

REGRAS DO TÍTULO:
- OBRIGATÓRIO usar "sentence case": apenas a PRIMEIRA LETRA da primeira palavra em maiúscula
- Nomes próprios (pessoas, times, cidades, competições) mantêm maiúscula normal
- Exemplo correto: "Flamengo anuncia novo reforço para a temporada"
- Exemplo ERRADO: "Flamengo Anuncia Novo Reforço Para a Temporada"
- Tom formal sem sensacionalismo, máximo 80 caracteres

IDENTIFICAÇÃO DO CLUBE:
Analise o conteúdo e identifique o CLUBE PRINCIPAL. Use APENAS um dos IDs:
${VALID_CLUB_IDS.join(', ')}
Se não se referir a nenhum clube específico, use null.

TÍTULO ORIGINAL:
${title}

CONTEÚDO ORIGINAL:
${content}

Responda APENAS em JSON válido:
{
  "shouldSkip": false,
  "rewrittenTitle": "título reescrito em sentence case",
  "rewrittenContent": "texto COMPLETAMENTE reescrito com palavras diferentes",
  "clubId": "id-do-clube-ou-null"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um jornalista esportivo experiente. Produza APENAS texto jornalístico limpo e legível. Use APENAS informações do texto fornecido. Sempre responda em JSON válido.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('AI API error:', text);
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.shouldSkip === true) {
        return { shouldSkip: true, rewrittenTitle: title, rewrittenContent: '' };
      }
      const detectedClubId = parsed.clubId && VALID_CLUB_IDS.includes(parsed.clubId) ? parsed.clubId : undefined;
      return {
        shouldSkip: false,
        rewrittenTitle: fixTitleCapitalization(parsed.rewrittenTitle || title, title),
        rewrittenContent: deepCleanText(parsed.rewrittenContent || content),
        detectedClubId,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }

  return { shouldSkip: false, rewrittenTitle: title, rewrittenContent: deepCleanText(content) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let requestedClubIds: string[] | null = null;
    let maxArticles = 5;
    let forceRewrite = false;
    try {
      const body = await req.json();
      if (body?.clubIds && Array.isArray(body.clubIds)) {
        requestedClubIds = body.clubIds;
        maxArticles = body.maxArticles || 10;
      }
      if (body?.forceRewrite === true) {
        forceRewrite = true;
      }
    } catch { /* no body, use defaults */ }

    // Force rewrite mode: delete existing news for requested clubs and re-scrape
    if (forceRewrite && requestedClubIds && requestedClubIds.length > 0) {
      console.log(`Force rewrite mode: deleting existing news for clubs: ${requestedClubIds.join(', ')}`);
      for (const clubId of requestedClubIds) {
        const { data: existing } = await supabase
          .from('football_news')
          .select('id')
          .eq('club_id', clubId)
          .order('published_at', { ascending: false })
          .limit(maxArticles);
        
        if (existing && existing.length > 0) {
          const ids = existing.map(e => e.id);
          const { error: delError } = await supabase
            .from('football_news')
            .delete()
            .in('id', ids);
          if (delError) console.error(`Delete error for ${clubId}:`, delError);
          else console.log(`Deleted ${ids.length} articles for ${clubId}`);
        }
      }
    }

    console.log('Starting news scrape (using native fetch + AI)...');

    let clubsThisRun: [string, string][];

    if (requestedClubIds) {
      // Scrape specific clubs
      clubsThisRun = requestedClubIds
        .filter(id => CLUB_GE_URLS[id])
        .map(id => [id, CLUB_GE_URLS[id]] as [string, string]);
      console.log(`Targeted scrape for clubs: ${clubsThisRun.map(c => c[0]).join(', ')}`);
    } else {
      // Rotate through clubs
      const CLUBS_PER_RUN = 8;
      const allClubEntries = Object.entries(CLUB_GE_URLS);
      const rotationIndex = Math.floor(Date.now() / (2 * 60 * 1000)) % Math.ceil(allClubEntries.length / CLUBS_PER_RUN);
      const clubBatchStart = rotationIndex * CLUBS_PER_RUN;
      clubsThisRun = allClubEntries.slice(clubBatchStart, clubBatchStart + CLUBS_PER_RUN) as [string, string][];
      console.log(`Club rotation: batch ${rotationIndex + 1}, clubs: ${clubsThisRun.map(c => c[0]).join(', ')}`);
    }

    // STEP 1: Fetch main football page (skip if targeted club scrape)
    let mainPageNews: NewsItem[] = [];
    if (!requestedClubIds) {
      console.log('Fetching main page...');
      try {
        const mainHtml = await fetchHtml('https://ge.globo.com/futebol/');
        mainPageNews = extractArticleUrls(mainHtml);
        console.log(`Main page: found ${mainPageNews.length} articles`);
      } catch (error) {
        console.error('Error fetching main page:', error);
      }
    }

    // STEP 2: Fetch club pages in parallel
    const clubResults = await Promise.all(
      clubsThisRun.map(async ([clubId, clubUrl]) => {
        try {
          const html = await fetchHtml(clubUrl);
          const news = extractArticleUrls(html, clubId, !!requestedClubIds);
          console.log(`Club ${clubId}: found ${news.length} articles`);
          return news;
        } catch (err) {
          console.error(`Error fetching club ${clubId}:`, err);
          return [];
        }
      })
    );

    const allClubNews = clubResults.flat();
    console.log(`Total club-specific articles found: ${allClubNews.length}`);

    // Combine all news, dedup
    const seenUrls = new Set<string>();
    const allNews: NewsItem[] = [];

    for (const item of mainPageNews) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allNews.push(item);
      }
    }
    for (const item of allClubNews) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allNews.push(item);
      } else {
        const existing = allNews.find(n => n.url === item.url);
        if (existing && item.clubId && !existing.clubId) {
          existing.clubId = item.clubId;
        }
      }
    }

    console.log(`Total unique articles: ${allNews.length}`);

    // Check existing URLs
    const { data: existingNews } = await supabase
      .from('football_news')
      .select('original_url')
      .order('created_at', { ascending: false })
      .limit(500);

    const existingUrls = new Set(existingNews?.map(n => n.original_url) || []);
    const newArticles = allNews.filter(n => !existingUrls.has(n.url));

    console.log(`${newArticles.length} new articles to process`);

    // Process up to 5 new articles
    const articlesToProcess = newArticles.slice(0, maxArticles);
    const processedNews: string[] = [];

    for (const article of articlesToProcess) {
      try {
        console.log(`Fetching article: ${article.url}`);

        // Fetch full article HTML
        const articleHtml = await fetchHtml(article.url);
        const details = extractArticleDetails(articleHtml, article.url);

        if (!requestedClubIds && !details.isRecent) {
          console.log(`Skipping old article: ${article.title}`);
          continue;
        }

        if (!details.content || details.content.length < 100) {
          console.log(`Skipping insufficient content: ${article.url}`);
          continue;
        }

        // Rewrite with AI
        let rewrittenTitle = article.title;
        let rewrittenContent = sanitizeRewrittenContent(details.content);
        let isOriginal = false;

        let detectedClubId: string | undefined;
        try {
          const rewritten = await rewriteWithAI(article.title, details.content);
          if (rewritten.shouldSkip) {
            console.log(`Skipping interactive article: ${article.title}`);
            continue;
          }
          rewrittenTitle = rewritten.rewrittenTitle;
          rewrittenContent = rewritten.rewrittenContent;
          detectedClubId = rewritten.detectedClubId;
        } catch (aiError) {
          console.log(`AI rewrite failed, using original: ${article.title}`);
          console.error('AI Error:', aiError);
          isOriginal = true;
          rewrittenTitle = article.title
            .split(' ')
            .map((word, index) => {
              if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              // Keep proper nouns (words that were originally capitalized and are likely names)
              if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]/.test(word) && word.length > 2) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              return word.toLowerCase();
            })
            .join(' ');
        }

        // Use scrape-based clubId first, then AI-detected clubId
        const finalClubId = article.clubId || detectedClubId || null;

        // Insert into database
        const { error: insertError } = await supabase
          .from('football_news')
          .insert({
            original_url: article.url,
            source_site: article.sourceSite,
            original_title: article.title,
            rewritten_title: rewrittenTitle,
            original_content: details.content,
            rewritten_content: rewrittenContent,
            image_url: details.imageUrl,
            image_caption: details.imageCaption,
            image_credits: details.imageCredits || null,
            category: 'Futebol',
            is_original: isOriginal,
            club_id: finalClubId,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          processedNews.push(rewrittenTitle);
          console.log(`✅ Processed: ${rewrittenTitle}${isOriginal ? ' (original)' : ''}`);
        }
      } catch (error) {
        console.error(`Error processing article ${article.url}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedNews.length,
        articles: processedNews
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
