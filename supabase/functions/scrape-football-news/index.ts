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

async function scrapeWithFirecrawl(url: string): Promise<any> {
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
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: false, // Get full page to find more articles
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

// Use Firecrawl Map to discover more URLs quickly
async function mapWebsiteUrls(baseUrl: string): Promise<string[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  console.log(`Mapping URLs from ${baseUrl}...`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: baseUrl,
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
  console.log(`Map found ${links.length} URLs`);
  return links;
}

function extractNewsFromGE(html: string, markdown: string, links?: string[], mappedUrls?: string[]): NewsItem[] {
  const news: NewsItem[] = [];
  const seenUrls = new Set<string>();
  
  // Helper to check if URL is a valid news article (not a game/match page)
  const isValidArticle = (url: string): boolean => {
    // Skip game/match pages - they don't have images
    if (url.includes('/jogo/')) return false;
    // Skip live/ao-vivo pages
    if (url.includes('/ao-vivo/')) return false;
    // Skip video pages
    if (url.includes('/video/')) return false;
    // Must be a news article with /noticia/ in URL
    if (!url.includes('/noticia/')) return false;
    // Must be from 2026 (current year) to ensure freshness
    if (!url.includes('/2026/')) return false;
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
}> {
  try {
    const result = await scrapeWithFirecrawl(url);
    const data = result.data || result;
    const markdown = data.markdown || '';
    const html = data.html || '';
    
    // Extract main content (first 2000 chars of markdown for processing)
    const content = markdown.slice(0, 2000);
    
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
    
    console.log(`Article ${url} - Image: ${imageUrl ? 'found' : 'NOT FOUND'}`);
    return { content, imageUrl, imageCaption, imageCredits };
  } catch (error) {
    console.error('Error scraping article:', url, error);
    return { content: '' };
  }
}

async function rewriteWithAI(title: string, content: string): Promise<{ rewrittenTitle: string; rewrittenContent: string; shouldSkip: boolean }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um jornalista esportivo sênior da Fanaticamente. Sua tarefa é reescrever notícias de futebol.

⚠️ REGRA FUNDAMENTAL - PROIBIÇÃO ABSOLUTA:
- Você DEVE usar EXCLUSIVAMENTE as informações contidas no texto original fornecido abaixo
- É PROIBIDO inventar, deduzir, inferir ou adicionar QUALQUER informação que NÃO esteja explicitamente escrita no texto original
- NÃO mencione competições, torneios, datas ou fatos que NÃO estejam no texto original
- Se algo não está no texto original, NÃO pode estar na reescrita
- NÃO INVENTE contexto histórico, estatísticas ou informações sobre competições que o time irá disputar
- Exemplo ERRADO: Se o texto fala de um reforço mas NÃO menciona Libertadores, você NÃO pode afirmar que o time disputará a Libertadores

PRIMEIRO, ANALISE SE A NOTÍCIA DEVE SER IGNORADA:
- Se a notícia pedir ao leitor para votar, participar de enquete, responder quiz, clicar em algo, ou realizar qualquer tarefa/ação, responda com "shouldSkip": true
- Exemplos de notícias a ignorar: "Vote no melhor gol", "Participe da enquete", "Escolha o craque", "Clique para ver"

SE A NOTÍCIA FOR VÁLIDA, REESCREVA SEGUINDO ESTAS REGRAS:

REGRAS DO TÍTULO:
1. Use "sentence case" - APENAS a primeira letra da primeira palavra em maiúscula
2. Nomes próprios DEVEM ter inicial maiúscula:
   - Nomes de pessoas (Neymar, Gabigol, Abel Ferreira)
   - Nomes de clubes por extenso (Flamengo, Palmeiras, Barcelona)
   - Abreviações de clubes (CAM, Flu, São Paulo FC)
   - Cidades e países (São Paulo, Argentina, Londres)
   - Competições (Brasileirão, Champions League, Libertadores)
3. Use linguagem formal e jornalística profissional
4. Remova sensacionalismo e pontuação excessiva

EXEMPLOS DE TÍTULOS CORRETOS:
- "Flamengo vence o Corinthians por 2 a 0 no Maracanã"
- "Neymar retorna ao Santos após passagem pelo Al-Hilal"
- "CAM confirma contratação de novo técnico argentino"

REGRAS DO CONTEÚDO:
1. USE APENAS informações que estão EXPLICITAMENTE no texto original abaixo
2. REESCREVA a notícia mantendo TODOS os fatos mencionados no original
3. NÃO adicione informações externas, contexto histórico inventado, ou suposições
4. Se o texto original mencionar competições específicas, use exatamente essas - NÃO invente outras
5. NÃO RESUMA - escreva uma matéria jornalística COMPLETA (400-600 palavras) baseada APENAS no original
6. Use linguagem jornalística formal e profissional (como Folha de S.Paulo ou O Globo)
7. Estrutura obrigatória:
   - Lide: primeiro parágrafo com as informações essenciais do texto original
   - Desenvolvimento: expandir os detalhes QUE ESTÃO no texto original
   - Declarações: cite APENAS falas que ESTÃO no texto original
   - Fechamento: baseado APENAS em informações do texto original
8. Evite gírias, expressões coloquiais ou sensacionalistas
9. Mantenha tom objetivo e informativo
10. Use voz ativa e frases bem estruturadas

TÍTULO ORIGINAL:
${title}

CONTEÚDO ORIGINAL (USE APENAS ESTAS INFORMAÇÕES):
${content}

Responda EXATAMENTE neste formato JSON:
{
  "shouldSkip": false,
  "rewrittenTitle": "título reescrito aqui",
  "rewrittenContent": "conteúdo baseado EXCLUSIVAMENTE no texto original acima"
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
        rewrittenContent: parsed.rewrittenContent || content,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { shouldSkip: false, rewrittenTitle: title, rewrittenContent: content };
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

    // Use Map API to discover URLs quickly
    const mappedUrls = await mapWebsiteUrls('https://ge.globo.com/futebol/');
    
    // Also scrape the main page for additional context
    console.log('Scraping main page for additional links...');
    let mainPageLinks: string[] = [];
    let mainPageMarkdown = '';
    let mainPageHtml = '';
    
    try {
      const result = await scrapeWithFirecrawl('https://ge.globo.com/futebol/');
      const data = result.data || result;
      mainPageMarkdown = data.markdown || '';
      mainPageHtml = data.html || '';
      mainPageLinks = data.links || [];
      console.log(`Got ${mainPageLinks.length} links from main page scrape`);
    } catch (error) {
      console.error('Error scraping main page:', error);
    }

    // Extract news using all available sources
    const allNews = extractNewsFromGE(mainPageHtml, mainPageMarkdown, mainPageLinks, mappedUrls);
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
        
        // Get full article details
        const details = await scrapeArticleDetails(article.url);
        
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
