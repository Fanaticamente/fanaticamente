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
}

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
  // Hard-remove any accidental attribution/citation lines.
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

function extractNewsFromGE(html: string, markdown: string, links?: string[], mappedUrls?: string[]): NewsItem[] {
  const news: NewsItem[] = [];
  const seenUrls = new Set<string>();
  
  // Get today's date for filtering recent news
  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;
  
  console.log(`Filtering for news from: ${today} or ${yesterdayStr}`);
  
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
  
  // Process URLs from the Map API first (most reliable for discovering new content)
  if (mappedUrls && Array.isArray(mappedUrls)) {
    console.log(`Processing ${mappedUrls.length} mapped URLs...`);
    for (const url of mappedUrls) {
      if (news.length >= 20) break;
      if (!url.includes('ge.globo.com/futebol/') || !url.endsWith('.ghtml')) continue;
      
      const cleanUrl = url.split('?')[0];
      if (seenUrls.has(cleanUrl)) continue;
      if (!isValidArticle(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
      
      // Extract title from URL path
      const pathMatch = cleanUrl.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
      if (pathMatch) {
        const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
        news.push({ url: cleanUrl, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com' });
      }
    }
    console.log(`Got ${news.length} articles from mapped URLs`);
  }
  
  // Pattern 1: Extract from markdown links
  const articlePattern = /\[([^\]]+)\]\((https:\/\/ge\.globo\.com\/futebol\/[^\s\)]+\.ghtml)\)/g;
  let match;
  
  while ((match = articlePattern.exec(markdown)) !== null && news.length < 20) {
    const title = match[1].trim();
    const url = match[2].split('?')[0]; // Remove query params
    
    if (seenUrls.has(url)) continue;
    if (!isValidArticle(url)) continue;
    if (title.length < 15 || title.includes('Veja mais') || title.includes('Saiba mais')) continue;
    
    seenUrls.add(url);
    news.push({ url, title, content: '', sourceSite: 'ge.globo.com' });
  }
  
  // Pattern 2: Extract URLs from links array provided by Firecrawl scrape
  if (links && Array.isArray(links)) {
    for (const link of links) {
      if (news.length >= 20) break;
      if (!link.includes('ge.globo.com/futebol/') || !link.endsWith('.ghtml')) continue;
      
      const cleanUrl = link.split('?')[0];
      if (seenUrls.has(cleanUrl)) continue;
      if (!isValidArticle(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
      
      // Extract title from URL path
      const pathMatch = cleanUrl.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
      if (pathMatch) {
        const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
        news.push({ url: cleanUrl, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com' });
      }
    }
  }
  
  // Pattern 3: Extract from HTML href attributes
  const hrefPattern = /href="(https:\/\/ge\.globo\.com\/futebol\/[^"]+\.ghtml)"/g;
  while ((match = hrefPattern.exec(html)) !== null && news.length < 20) {
    const url = match[1].split('?')[0];
    if (seenUrls.has(url)) continue;
    if (!isValidArticle(url)) continue;
    seenUrls.add(url);
    
    const pathMatch = url.match(/\/noticia\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\.ghtml/);
    if (pathMatch) {
      const titleFromUrl = pathMatch[1].replace(/-/g, ' ');
      news.push({ url, title: titleFromUrl, content: '', sourceSite: 'ge.globo.com' });
    }
  }
  
  console.log(`Extracted ${news.length} unique articles`);
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

  const prompt = `Você é um jornalista esportivo sênior da Fanaticamente. Sua tarefa é REESCREVER notícias de futebol de forma COMPLETA.

⚠️ REGRAS ABSOLUTAS:
1. Use EXCLUSIVAMENTE informações do texto original - NÃO invente NADA
2. NÃO RESUMA - sua reescrita deve ter o MESMO tamanho ou MAIOR que o original
3. Mantenha TODOS os fatos, declarações, números e detalhes do original
4. Apenas REFORMULE as frases com palavras diferentes para evitar plágio
5. PROIBIDO incluir: "Fonte:", URLs, citações de site (Globo, ge.globo.com, g1, Globoplay) ou instruções de navegação/assinatura

PRIMEIRO, ANALISE SE DEVE IGNORAR:
- Se pedir para votar, participar de enquete, quiz, ou realizar ação, responda: {"shouldSkip": true}

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
8. Estrutura: Lide → Desenvolvimento → Declarações → Fechamento

EXEMPLO DE REESCRITA CORRETA:
Original: "O Flamengo anunciou a contratação de João Silva por R$ 10 milhões. 'Estou muito feliz', disse o jogador."
Reescrito: "O Rubro-Negro carioca oficializou a chegada do atleta João Silva em negociação avaliada em R$ 10 milhões. 'Estou muito feliz', declarou o reforço."

TÍTULO ORIGINAL:
${title}

CONTEÚDO ORIGINAL COMPLETO (REESCREVA TUDO, NÃO RESUMA):
${content}

Responda em JSON:
{
  "shouldSkip": false,
  "rewrittenTitle": "título reformulado",
  "rewrittenContent": "texto COMPLETO reformulado com todas as informações do original"
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
        { role: 'system', content: 'Você é um jornalista esportivo experiente. Use APENAS informações do texto fornecido. NÃO invente fatos. Sempre responda em JSON válido.' },
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
      return {
        shouldSkip: parsed.shouldSkip === true,
        rewrittenTitle: parsed.rewrittenTitle || title,
        rewrittenContent: sanitizeRewrittenContent(parsed.rewrittenContent || content),
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { shouldSkip: false, rewrittenTitle: title, rewrittenContent: sanitizeRewrittenContent(content) };
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

    // Map multiple sections to catch all news including team-specific pages
    // Include main sections AND popular team pages for comprehensive coverage
    const sectionsToScrape = [
      'https://ge.globo.com/futebol/',
      'https://ge.globo.com/futebol/futebol-internacional/',
      'https://ge.globo.com/futebol/brasileirao-serie-a/',
      'https://ge.globo.com/futebol/brasileirao-serie-b/',
      // Popular teams - most active news sources
      'https://ge.globo.com/futebol/times/flamengo/',
      'https://ge.globo.com/futebol/times/corinthians/',
      'https://ge.globo.com/futebol/times/palmeiras/',
      'https://ge.globo.com/futebol/times/sao-paulo/',
      'https://ge.globo.com/futebol/times/fluminense/',
      'https://ge.globo.com/futebol/times/vasco/',
      'https://ge.globo.com/futebol/times/botafogo/',
      'https://ge.globo.com/futebol/times/santos/',
      'https://ge.globo.com/futebol/times/gremio/',
      'https://ge.globo.com/futebol/times/internacional/',
      'https://ge.globo.com/futebol/times/atletico-mg/',
      'https://ge.globo.com/futebol/times/cruzeiro/',
      'https://ge.globo.com/futebol/times/chapecoense/',
      'https://ge.globo.com/futebol/times/sport/',
      'https://ge.globo.com/futebol/times/coritiba/',
      'https://ge.globo.com/futebol/times/bahia/',
      'https://ge.globo.com/futebol/times/fortaleza/',
    ];
    
    // Collect URLs from all sections in parallel with error handling
    console.log(`Mapping ${sectionsToScrape.length} sections...`);
    const mappedUrlsArrays = await Promise.all(
      sectionsToScrape.map(section => mapWebsiteUrls(section).catch(() => []))
    );
    
    // Combine and dedupe all mapped URLs
    const allMappedUrls = [...new Set(mappedUrlsArrays.flat())];
    console.log(`Total mapped URLs from all sections: ${allMappedUrls.length}`);
    
    // Also scrape the main page for additional context
    console.log('Scraping main page for additional links...');
    let mainPageLinks: string[] = [];
    let mainPageMarkdown = '';
    let mainPageHtml = '';
    
    try {
      const result = await scrapeWithFirecrawl('https://ge.globo.com/futebol/', { onlyMainContent: false, formats: ['markdown', 'html', 'links'] });
      const data = result.data || result;
      mainPageMarkdown = data.markdown || '';
      mainPageHtml = data.html || '';
      mainPageLinks = data.links || [];
      console.log(`Got ${mainPageLinks.length} links from main page scrape`);
    } catch (error) {
      console.error('Error scraping main page:', error);
    }

    // Extract news using all available sources
    const allNews = extractNewsFromGE(mainPageHtml, mainPageMarkdown, mainPageLinks, allMappedUrls);
    console.log(`Total articles found: ${allNews.length}`);

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

        // Rewrite with AI
        const rewritten = await rewriteWithAI(article.title, details.content);

        // Skip interactive/task-based articles
        if (rewritten.shouldSkip) {
          console.log(`Skipping interactive article: ${article.title}`);
          continue;
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from('football_news')
          .insert({
            original_url: article.url,
            source_site: article.sourceSite,
            original_title: article.title,
            rewritten_title: rewritten.rewrittenTitle,
            original_content: details.content,
            rewritten_content: rewritten.rewrittenContent,
            image_url: details.imageUrl,
            image_caption: details.imageCaption,
            image_credits: details.imageCredits,
            category: 'Futebol',
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          processedNews.push(article.title);
          console.log(`Successfully processed: ${article.title}`);
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
