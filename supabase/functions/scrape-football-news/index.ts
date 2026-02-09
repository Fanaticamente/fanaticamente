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
  imageCredits?: string;
  sourceSite: string;
  clubId?: string; // Club ID if scraped from a club-specific page
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
  "santos": "https://ge.globo.com/pa/futebol/times/santos/",
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

async function scrapeWithFirecrawl(
  url: string,
  options?: { onlyMainContent?: boolean; formats?: string[] }
): Promise<any> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  // Add cache-busting timestamp to force fresh content
  const urlWithTimestamp = url.includes('?') 
    ? `${url}&_t=${Date.now()}` 
    : `${url}?_t=${Date.now()}`;

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: urlWithTimestamp,
      formats: options?.formats || ['markdown', 'html', 'links'],
      // For article pages we want only main content; for home pages we may want full.
      onlyMainContent: options?.onlyMainContent ?? false,
      skipTlsVerification: false,
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Firecrawl error:', text);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  return response.json();
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
    // Single word or very short lines that are likely menu items
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
  // Hard-remove any accidental attribution/citation lines and photo credits.
  let result = text
    .replace(/\r\n/g, '\n')
    // Remove photo credit patterns like "— Foto: Getty Images" or "Foto: Reprodução"
    .replace(/—?\s*Foto:\s*[^\n]+/gi, '')
    // Remove patterns like "Nome — Foto: ..."
    .replace(/[A-Za-zÀ-ú\s]+—\s*Foto:\s*[^\n]+/gi, '')
    // Remove markdown image syntax ![...](...) including multi-line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Remove timestamp patterns like "Há 10 minutos" or "Há 1 hora"
    .replace(/^Há\s+\d+\s+(minuto|hora|segundo|dia)s?\s*[a-záàâãéèêíïóôõöúç\s]*$/gim, '')
    // Remove timestamps with team names like "Há 6 horas gato mestre" or "Há 5 horas corinthians"
    .replace(/Há\s+\d+\s+(minuto|hora|segundo|dia)s?\s+[a-záàâãéèêíïóôõöúç\s]+/gi, '')
    // Remove "Acompanhe a cobertura" patterns
    .replace(/^Acompanhe a cobertura.*$/gim, '')
    // Remove lines that are just club/section names (single words/short phrases)
    .replace(/^(flamengo|corinthians|palmeiras|são paulo|santos|vasco|botafogo|fluminense|grêmio|internacional|atlético-mg|cruzeiro|bahia|fortaleza|sport|coritiba|futebol internacional|gato mestre|brasileirão)\s*$/gim, '')
    .split('\n')
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      if (/^fonte\s*:/i.test(l)) return false;
      if (/https?:\/\//i.test(l)) return false;
      if (/ge\.globo\.com|\bglobo\.com\b|\bg1\b|globoplay/i.test(l)) return false;
      // Remove standalone photo credit lines
      if (/^\s*Foto:\s*/i.test(l)) return false;
      // Remove lines that are just navigation/metadata
      if (/^(TIMES|Série [AB]|Europa|Internacional|Brasileirão)$/i.test(l)) return false;
      return true;
    })
    .join('\n')
    // Remove duplicate consecutive lines
    .split('\n')
    .filter((line, index, arr) => index === 0 || line.trim().toLowerCase() !== arr[index - 1].trim().toLowerCase())
    .join('\n')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return result;
}

// Validate text quality - returns true if text is clean and readable
function validateTextQuality(text: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for orphan timestamps
  if (/Há\s+\d+\s+(minuto|hora|segundo|dia)s?/i.test(text)) {
    issues.push('Contém timestamps órfãos');
  }
  
  // Check for markdown image syntax
  if (/!\[[^\]]*\]\([^)]*\)/.test(text)) {
    issues.push('Contém sintaxe de imagem markdown');
  }
  
  // Check for photo credits
  if (/—?\s*Foto:\s*/i.test(text)) {
    issues.push('Contém créditos de foto');
  }
  
  // Check for URLs
  if (/https?:\/\//i.test(text)) {
    issues.push('Contém URLs');
  }
  
  // Check for disconnected words (lines with less than 3 words that don't end with punctuation)
  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const words = line.trim().split(/\s+/);
    if (words.length <= 2 && words.length > 0 && !/[.!?:,]$/.test(line.trim())) {
      // Skip if it's a proper name or title capitalized
      if (!/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)*$/.test(line.trim())) {
        issues.push(`Linha desconectada: "${line.trim().substring(0, 30)}..."`);
        break; // Only report first issue
      }
    }
  }
  
  // Check for repeated content (same paragraph appearing twice)
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim().toLowerCase()).filter(p => p.length > 50);
  const seen = new Set<string>();
  for (const p of paragraphs) {
    if (seen.has(p)) {
      issues.push('Contém parágrafos duplicados');
      break;
    }
    seen.add(p);
  }
  
  // Check for source references
  if (/\bge\.globo\.com\b|\bglobo\b|\bg1\b/i.test(text)) {
    issues.push('Contém referência a fonte original');
  }
  
  return { isValid: issues.length === 0, issues };
}

// Deep clean text - aggressively remove all problematic content
function deepCleanText(text: string): string {
  let cleaned = sanitizeRewrittenContent(text);
  
  // Additional aggressive cleaning
  cleaned = cleaned
    // Remove any remaining markdown syntax
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/#{1,6}\s+/g, '') // Headers
    // Remove lines that are navigation items
    .split('\n')
    .filter(line => {
      const l = line.trim().toLowerCase();
      // Skip very short lines that look like menu items
      if (l.length < 15 && !l.includes('.') && !l.includes('!') && !l.includes('?')) {
        // Allow if it's clearly part of article (e.g., quotes, names)
        if (!/^["']/.test(l) && !/[a-z],$/.test(l)) {
          return false;
        }
      }
      return true;
    })
    .join('\n')
    // Remove duplicate paragraphs
    .split(/\n\s*\n/)
    .filter((para, index, arr) => {
      const normalized = para.trim().toLowerCase();
      return arr.findIndex(p => p.trim().toLowerCase() === normalized) === index;
    })
    .join('\n\n')
    .trim();
  
  return cleaned;
}

// Use Firecrawl Map to discover more URLs quickly
async function mapWebsiteUrls(baseUrl: string): Promise<string[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  // Add cache-busting timestamp to force fresh content discovery
  const urlWithTimestamp = baseUrl.includes('?') 
    ? `${baseUrl}&_t=${Date.now()}` 
    : `${baseUrl}?_t=${Date.now()}`;

  console.log(`Mapping URLs from ${urlWithTimestamp} (cache-busted)...`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    body: JSON.stringify({
      url: urlWithTimestamp,
      limit: 100, // Get up to 100 URLs
      includeSubdomains: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Firecrawl map error:', text);
    return [];
  }

  const data = await response.json();
  const links = data.links || [];
  console.log(`Map found ${links.length} URLs (fresh fetch)`);
  return links;
}

function extractNewsFromGE(html: string, markdown: string, links?: string[], mappedUrls?: string[], clubId?: string): NewsItem[] {
  const news: NewsItem[] = [];
  const seenUrls = new Set<string>();
  
  // Get today's date for filtering recent news
  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;
  
  console.log(`Filtering for news from: ${today} or ${yesterdayStr}${clubId ? ` (club: ${clubId})` : ''}`);
  
  // Helper to check if URL is a valid recent news article
  const isValidArticle = (url: string): boolean => {
    // Skip game/match pages - they don't have images
    if (url.includes('/jogo/')) return false;
    // Skip live/ao-vivo pages
    if (url.includes('/ao-vivo/')) return false;
    // Skip video pages
    if (url.includes('/video/')) return false;
    // Must be a news article with /noticia/ in URL
    if (!url.includes('/noticia/')) return false;
    
    // Only allow articles from today or yesterday
    const hasToday = url.includes(`/noticia/${today}/`);
    const hasYesterday = url.includes(`/noticia/${yesterdayStr}/`);
    if (!hasToday && !hasYesterday) {
      return false;
    }
    
    return true;
  };
  
  // PRIORITY 1: Extract from HTML href attributes (main page has freshest content)
  // This gets articles visible on the homepage RIGHT NOW
  console.log('Extracting from HTML hrefs (priority - freshest content)...');
  const hrefPattern = /href="(https:\/\/ge\.globo\.com\/(?:[a-z]{2}\/(?:[a-z-]+\/)?)?futebol\/[^"]+\.ghtml)"/g;
  let match;
  while ((match = hrefPattern.exec(html)) !== null && news.length < 25) {
    const url = match[1].split('?')[0];
    if (seenUrls.has(url)) continue;
    if (!isValidArticle(url)) continue;
    seenUrls.add(url);
    
    const pathMatch = url.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
    if (pathMatch) {
      const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
      news.push({ url, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com', clubId });
    }
  }
  console.log(`Got ${news.length} articles from HTML hrefs`);
  
  // PRIORITY 2: Extract from markdown links (also from main page)
  console.log('Extracting from markdown links...');
  const articlePattern = /\[([^\]]+)\]\((https:\/\/ge\.globo\.com\/(?:[a-z]{2}\/(?:[a-z-]+\/)?)?futebol\/[^\s\)]+\.ghtml)\)/g;
  while ((match = articlePattern.exec(markdown)) !== null && news.length < 25) {
    const title = match[1].trim();
    const url = match[2].split('?')[0];
    
    if (seenUrls.has(url)) continue;
    if (!isValidArticle(url)) continue;
    if (title.length < 15 || title.includes('Veja mais') || title.includes('Saiba mais')) continue;
    
    seenUrls.add(url);
    news.push({ url, title, content: '', sourceSite: 'ge.globo.com', clubId });
  }
  console.log(`Total after markdown: ${news.length} articles`);
  
  // PRIORITY 3: Extract URLs from links array provided by Firecrawl scrape
  if (links && Array.isArray(links)) {
    console.log(`Processing ${links.length} direct links from scrape...`);
    for (const link of links) {
      if (news.length >= 25) break;
      if (!link.includes('ge.globo.com/') || !link.endsWith('.ghtml') || !link.includes('/futebol/')) continue;
      
      const cleanUrl = link.split('?')[0];
      if (seenUrls.has(cleanUrl)) continue;
      if (!isValidArticle(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
      
      const pathMatch = cleanUrl.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
      if (pathMatch) {
        const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
        news.push({ url: cleanUrl, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com', clubId });
      }
    }
    console.log(`Total after direct links: ${news.length} articles`);
  }
  
  // PRIORITY 4 (LAST): Process URLs from the Map API (sitemap - may have older content)
  if (mappedUrls && Array.isArray(mappedUrls) && news.length < 25) {
    console.log(`Processing ${mappedUrls.length} mapped URLs (lower priority)...`);
    for (const url of mappedUrls) {
      if (news.length >= 25) break;
      if (!url.includes('ge.globo.com/') || !url.endsWith('.ghtml') || !url.includes('/futebol/')) continue;
      
      const cleanUrl = url.split('?')[0];
      if (seenUrls.has(cleanUrl)) continue;
      if (!isValidArticle(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
      
      const pathMatch = cleanUrl.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
      if (pathMatch) {
        const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
        news.push({ url: cleanUrl, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com', clubId });
      }
    }
    console.log(`Total after mapped URLs: ${news.length} articles`);
  }
  
  console.log(`Extracted ${news.length} unique articles total`);
  return news;
}

function extractNewsFromElGrafico(html: string, markdown: string, links?: string[]): NewsItem[] {
  const news: NewsItem[] = [];
  
  // Extract article links from El Grafico
  const articlePattern = /\[([^\]]+)\]\((https:\/\/www\.elgrafico\.com\.ar\/[^\s\)]+)\)/g;
  let match;
  
  while ((match = articlePattern.exec(markdown)) !== null && news.length < 10) {
    const title = match[1].trim();
    const url = match[2];
    
    if (title.length < 15) continue;
    
    news.push({
      url,
      title,
      content: '',
      sourceSite: 'elgrafico.com.ar',
    });
  }
  
  return news;
}

async function scrapeArticleDetails(url: string): Promise<{
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  imageCredits?: string;
  publishedAt?: Date;
  isRecent: boolean;
}> {
  try {
    // For article pages, request only main content to avoid boilerplate.
    const result = await scrapeWithFirecrawl(url, { onlyMainContent: true, formats: ['markdown', 'html'] });
    const data = result.data || result;
    const markdown = data.markdown || '';
    const html = data.html || '';
    
    // Extract full article content - increased limit to capture complete articles
    const content = cleanOriginalArticleText(markdown).slice(0, 16000);
    
    // Extract publication date/time from article metadata
    let publishedAt: Date | undefined;
    let isRecent = false;
    
    // Pattern 1: Look for datePublished in JSON-LD
    const jsonLdMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
    if (jsonLdMatch) {
      publishedAt = new Date(jsonLdMatch[1]);
      console.log(`Found datePublished from JSON-LD: ${publishedAt.toISOString()}`);
    }
    
    // Pattern 2: Look for article:published_time meta tag
    if (!publishedAt) {
      const metaMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i);
      if (metaMatch) {
        publishedAt = new Date(metaMatch[1]);
        console.log(`Found datePublished from meta tag: ${publishedAt.toISOString()}`);
      }
    }
    
    // Pattern 3: Look for time element with datetime attribute
    if (!publishedAt) {
      const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
      if (timeMatch) {
        publishedAt = new Date(timeMatch[1]);
        console.log(`Found datePublished from time element: ${publishedAt.toISOString()}`);
      }
    }
    
    // Check if article is recent (published within last 6 hours)
    if (publishedAt && !isNaN(publishedAt.getTime())) {
      const now = new Date();
      const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
      isRecent = hoursSincePublished <= 6;
      console.log(`Article age: ${hoursSincePublished.toFixed(1)} hours, isRecent: ${isRecent}`);
    } else {
      // If we can't determine the date, check URL date as fallback
      const today = new Date();
      const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
      isRecent = url.includes(`/noticia/${todayStr}/`);
      console.log(`Could not extract date, using URL date check. isRecent: ${isRecent}`);
    }
    
    // Try to extract image from HTML - multiple patterns
    let imageUrl: string | undefined;
    let imageCaption: string | undefined;
    let imageCredits: string | undefined;
    
    // Pattern 1: Look for og:image meta tag (most reliable for main article image)
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
      console.log('Found og:image:', imageUrl);
    }
    
    // Pattern 2: Look for main article image in figure tags
    if (!imageUrl) {
      const figureImgMatch = html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (figureImgMatch) {
        imageUrl = figureImgMatch[1].split('?')[0]; // Remove query params
        console.log('Found figure image:', imageUrl);
      }
    }
    
    // Pattern 3: Look for data-src (lazy loaded images)
    if (!imageUrl) {
      const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (dataSrcMatch) {
        imageUrl = dataSrcMatch[1].split('?')[0];
        console.log('Found data-src image:', imageUrl);
      }
    }
    
    // Pattern 4: Regular img src
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*>/i);
      if (imgMatch) {
        const src = imgMatch[1];
        // Skip small icons and logos
        if (!src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
          imageUrl = src.split('?')[0];
          console.log('Found img src:', imageUrl);
        }
      }
    }
    
    // Pattern 5: Extract from markdown image syntax
    if (!imageUrl) {
      const mdImageMatch = markdown.match(/!\[[^\]]*\]\(([^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/i);
      if (mdImageMatch) {
        imageUrl = mdImageMatch[1].split('?')[0];
        console.log('Found markdown image:', imageUrl);
      }
    }
    
    // Clean up image URL
    if (imageUrl) {
      // Ensure it's a full URL
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        // Relative URL - try to construct full URL from the article URL
        const urlObj = new URL(url);
        imageUrl = urlObj.origin + imageUrl;
      }
      // Remove size parameters that might make image too small
      imageUrl = imageUrl.replace(/\/\d+x\d+\//, '/');
    }
    
    // Look for figure with figcaption - this is where GE stores the caption
    const figcaptionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (figcaptionMatch) {
      let fullCaption = figcaptionMatch[1].replace(/<[^>]+>/g, '').trim();
      
      // Clean up the caption - remove pagination like "1 de 2"
      fullCaption = fullCaption.replace(/^\d+ de \d+\s*/i, '').trim();
      
      // Parse caption format: "Description — Foto: Credit" or just "Foto: Credit"
      if (fullCaption.includes('—')) {
        const parts = fullCaption.split('—');
        const descriptionPart = parts[0].trim();
        const creditPart = parts.slice(1).join('—').trim();
        
        // Extract ONLY the person's name from the description
        // Remove action descriptions like "durante entrevista para o ge" 
        // Keep only "Name" or "Name, do Clube"
        if (descriptionPart && 
            !descriptionPart.includes('|') && 
            descriptionPart.length > 3) {
          // If contains "durante", "em", "no", "na" - extract only the name before
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
            / momento .*/i,
            / concede .*/i,
            / fala .*/i,
            / conversa .*/i,
          ];
          
          let cleanedCaption = descriptionPart;
          for (const pattern of actionPatterns) {
            cleanedCaption = cleanedCaption.replace(pattern, '');
          }
          cleanedCaption = cleanedCaption.trim();
          
          if (cleanedCaption.length > 3) {
            imageCaption = cleanedCaption;
          }
        }
        
        if (creditPart) {
          // Clean credits from pagination
          imageCredits = creditPart.replace(/^\d+ de \d+\s*/i, '').trim();
        }
      } else if (fullCaption.startsWith('Foto:') || fullCaption.startsWith('Crédito:')) {
        imageCredits = fullCaption;
      } else if (!fullCaption.includes('|') && fullCaption.length > 3) {
        // For simple captions, also try to clean action descriptions
        let cleanedCaption = fullCaption;
        const actionPatterns = [
          / durante .*/i,
          / em partida .*/i,
          / em treino .*/i,
          / em entrevista .*/i,
        ];
        for (const pattern of actionPatterns) {
          cleanedCaption = cleanedCaption.replace(pattern, '');
        }
        if (cleanedCaption.length > 3) {
          imageCaption = cleanedCaption.trim();
        }
      }
    }
    
    console.log(`Article ${url} - Image: ${imageUrl ? 'found' : 'NOT FOUND'}, isRecent: ${isRecent}`);
    return { content, imageUrl, imageCaption, imageCredits, publishedAt, isRecent };
  } catch (error) {
    console.error('Error scraping article:', url, error);
    return { content: '', isRecent: false };
  }
}

async function rewriteWithAI(title: string, content: string): Promise<{ rewrittenTitle: string; rewrittenContent: string; shouldSkip: boolean }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um jornalista esportivo sênior da Fanaticamente. Sua tarefa é REESCREVER notícias de futebol de forma COMPLETA e LIMPA.

⚠️ REGRAS ABSOLUTAS DE QUALIDADE:
1. O texto deve ser 100% LEGÍVEL - sem palavras soltas, timestamps, ou linhas desconexas
2. NUNCA inclua: timestamps ("Há X minutos/horas"), nomes de seções ("flamengo", "corinthians"), créditos de foto
3. NUNCA inclua: URLs, markdown de imagem (![...]()), referências a ge.globo.com ou Globo
4. Cada parágrafo deve ser completo e fazer sentido isoladamente
5. Use pontuação correta em todas as frases
6. O texto deve fluir naturalmente de parágrafo em parágrafo

⚠️ REGRAS DE CONTEÚDO:
1. Use EXCLUSIVAMENTE informações do texto original - NÃO invente NADA
2. NÃO RESUMA - sua reescrita deve ter o MESMO tamanho ou MAIOR que o original
3. Mantenha TODOS os fatos, declarações, números e detalhes do original
4. Apenas REFORMULE as frases com palavras diferentes para evitar plágio
5. PROIBIDO: "Fonte:", URLs, citações de site, instruções de navegação/assinatura

PRIMEIRO, ANALISE SE DEVE IGNORAR:
- Se pedir para votar, participar de enquete, quiz, ou realizar ação, responda: {"shouldSkip": true}

REGRAS DO TÍTULO:
- Use "sentence case" (só primeira letra maiúscula, exceto nomes próprios)
- Nomes próprios em maiúscula: Neymar, Flamengo, Brasileirão, São Paulo
- Tom formal sem sensacionalismo
- Máximo 80 caracteres

ESTRUTURA DO CONTEÚDO:
1. LIDE (primeiro parágrafo): Resumo do fato principal em 2-3 frases
2. DESENVOLVIMENTO: Detalhes e contexto do acontecimento
3. DECLARAÇÕES: Mantenha aspas originais, reformule apenas a introdução
4. FECHAMENTO: Conclusão ou próximos passos

REGRAS DE FORMATAÇÃO:
1. Parágrafos com 3-5 frases cada
2. Frases completas com sujeito, verbo e predicado
3. Pontuação correta (ponto final, vírgulas, dois-pontos)
4. SEM linhas em branco desnecessárias dentro de parágrafos
5. O texto final deve ter entre 400-800 palavras

TÍTULO ORIGINAL:
${title}

CONTEÚDO ORIGINAL COMPLETO (REESCREVA TUDO, NÃO RESUMA):
${content}

Responda APENAS em JSON válido:
{
  "shouldSkip": false,
  "rewrittenTitle": "título reformulado",
  "rewrittenContent": "texto COMPLETO reformulado, limpo e legível"
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
        { role: 'system', content: 'Você é um jornalista esportivo experiente. Produza APENAS texto jornalístico limpo e legível. Use APENAS informações do texto fornecido. NÃO invente fatos. Sempre responda em JSON válido.' },
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
  
  // Parse JSON from response
  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.shouldSkip === true) {
        return { shouldSkip: true, rewrittenTitle: title, rewrittenContent: '' };
      }
      
      // Apply deep cleaning and validation
      let cleanedContent = deepCleanText(parsed.rewrittenContent || content);
      const validation = validateTextQuality(cleanedContent);
      
      if (!validation.isValid) {
        console.log(`Quality issues found: ${validation.issues.join(', ')}`);
        // Apply additional cleaning
        cleanedContent = deepCleanText(cleanedContent);
      }
      
      return {
        shouldSkip: false,
        rewrittenTitle: parsed.rewrittenTitle || title,
        rewrittenContent: cleanedContent,
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

    console.log('Starting news scrape...');

    // OPTIMIZED APPROACH: Rotate through clubs to avoid rate limits
    // Each run processes the main page + a rotating subset of clubs
    // With 40 clubs and 8 per run, full coverage every ~5 runs (10 minutes)
    const CLUBS_PER_RUN = 8;
    
    // Get all club entries and determine which batch to process this run
    const allClubEntries = Object.entries(CLUB_GE_URLS);
    
    // Use a simple rotation based on the current minute (changes every 2 min with auto-scrape)
    const rotationIndex = Math.floor(Date.now() / (2 * 60 * 1000)) % Math.ceil(allClubEntries.length / CLUBS_PER_RUN);
    const clubBatchStart = rotationIndex * CLUBS_PER_RUN;
    const clubsThisRun = allClubEntries.slice(clubBatchStart, clubBatchStart + CLUBS_PER_RUN);
    
    console.log(`Club rotation: batch ${rotationIndex + 1}/${Math.ceil(allClubEntries.length / CLUBS_PER_RUN)}, clubs: ${clubsThisRun.map(c => c[0]).join(', ')}`);
    
    // STEP 1: Scrape the main page (1 Firecrawl call)
    console.log('Scraping main page for recent news...');
    let mainPageLinks: string[] = [];
    let mainPageMarkdown = '';
    let mainPageHtml = '';
    
    try {
      const mainPageUrl = `https://ge.globo.com/futebol/?_nocache=${Date.now()}&r=${Math.random()}`;
      const result = await scrapeWithFirecrawl(mainPageUrl, { onlyMainContent: false, formats: ['markdown', 'html', 'links'] });
      const data = result.data || result;
      mainPageMarkdown = data.markdown || '';
      mainPageHtml = data.html || '';
      mainPageLinks = data.links || [];
      console.log(`Got ${mainPageLinks.length} links from main page scrape`);
    } catch (error) {
      console.error('Error scraping main page:', error);
    }

    // Extract news from main page (no club_id)
    const mainPageNews = extractNewsFromGE(mainPageHtml, mainPageMarkdown, mainPageLinks, [], undefined);
    console.log(`Main page articles found: ${mainPageNews.length}`);
    
    // STEP 2: Scrape club pages - only 1 Firecrawl call per club (no map, just scrape for links)
    // This uses only 8 calls instead of 80+
    const allClubNews: NewsItem[] = [];
    
    // Process clubs in parallel (only 8, so safe)
    const clubResults = await Promise.all(
      clubsThisRun.map(async ([clubId, clubUrl]) => {
        try {
          const url = `${clubUrl}?_nocache=${Date.now()}&r=${Math.random()}`;
          // Only request html and links - skip markdown to be lighter
          const result = await scrapeWithFirecrawl(url, { onlyMainContent: false, formats: ['html', 'links'] });
          const data = result.data || result;
          const news = extractNewsFromGE(
            data.html || '', 
            '', // no markdown needed for link discovery
            data.links || [], 
            [], // no mapped URLs - skip map call entirely
            clubId
          );
          console.log(`Club ${clubId}: found ${news.length} articles`);
          return news;
        } catch (err) {
          console.error(`Error scraping club ${clubId}:`, err);
          return [];
        }
      })
    );
    
    allClubNews.push(...clubResults.flat());
    console.log(`Total club-specific articles found: ${allClubNews.length}`);
    
    // Combine all news, prioritizing main page (fresher) but keeping club_id for club-specific
    const seenUrls = new Set<string>();
    const allNews: NewsItem[] = [];
    
    // Add main page news first (no club_id, but fresher)
    for (const item of mainPageNews) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allNews.push(item);
      }
    }
    
    // Add club news (has club_id for filtering)
    for (const item of allClubNews) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allNews.push(item);
      } else {
        // If article already exists from main page, update it with club_id
        const existingIndex = allNews.findIndex(n => n.url === item.url);
        if (existingIndex !== -1 && item.clubId && !allNews[existingIndex].clubId) {
          allNews[existingIndex].clubId = item.clubId;
        }
      }
    }
    
    console.log(`Total unique articles found: ${allNews.length}`);

    // Check which URLs already exist - fetch ALL existing URLs to avoid duplicates
    const { data: existingNews } = await supabase
      .from('football_news')
      .select('original_url')
      .order('created_at', { ascending: false })
      .limit(500);

    const existingUrls = new Set(existingNews?.map(n => n.original_url) || []);
    const newArticles = allNews.filter(n => !existingUrls.has(n.url));

    console.log(`${newArticles.length} new articles to process`);

    // Process up to 5 new articles at a time
    const articlesToProcess = newArticles.slice(0, 5);
    const processedNews = [];

    for (const article of articlesToProcess) {
      try {
        console.log(`Processing: ${article.title}`);
        
        // Get full article details including publication time
        const details = await scrapeArticleDetails(article.url);
        
        // Skip if article is not recent (older than 6 hours)
        if (!details.isRecent) {
          console.log(`Skipping old article: ${article.title} - not published within last 6 hours`);
          continue;
        }
        
        if (!details.content || details.content.length < 100) {
          console.log(`Skipping ${article.url} - insufficient content`);
          continue;
        }

        // Try to rewrite with AI, but fallback to original if it fails
        let rewrittenTitle = article.title;
        let rewrittenContent = sanitizeRewrittenContent(details.content);
        let isOriginal = false;
        
        try {
          const rewritten = await rewriteWithAI(article.title, details.content);
          
          // Skip interactive/task-based articles
          if (rewritten.shouldSkip) {
            console.log(`Skipping interactive article: ${article.title}`);
            continue;
          }
          
          rewrittenTitle = rewritten.rewrittenTitle;
          rewrittenContent = rewritten.rewrittenContent;
        } catch (aiError) {
          // AI failed (e.g., no credits) - use original content with credits
          console.log(`AI rewrite failed, using original content for: ${article.title}`);
          console.error('AI Error:', aiError);
          isOriginal = true;
          
          // Capitalize title properly for display
          rewrittenTitle = article.title
            .split(' ')
            .map((word, index) => {
              if (index === 0 || word.length > 3) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              }
              return word.toLowerCase();
            })
            .join(' ');
        }

        // Insert into database with club_id
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
            image_credits: details.imageCredits,
            category: 'Futebol',
            is_original: isOriginal,
            club_id: article.clubId || null, // Include club_id if available
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          processedNews.push(article.title);
          console.log(`Successfully processed: ${article.title}${isOriginal ? ' (original content)' : ''}`);
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
