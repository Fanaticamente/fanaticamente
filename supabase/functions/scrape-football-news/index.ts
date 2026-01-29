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

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Firecrawl error:', text);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  return response.json();
}

function extractNewsFromGE(html: string, markdown: string): NewsItem[] {
  const news: NewsItem[] = [];
  
  // Extract article links and titles from the markdown/html
  const articlePattern = /\[([^\]]+)\]\((https:\/\/ge\.globo\.com\/futebol\/[^\s\)]+)\)/g;
  let match;
  
  while ((match = articlePattern.exec(markdown)) !== null && news.length < 10) {
    const title = match[1].trim();
    const url = match[2];
    
    // Skip if title is too short or is navigation
    if (title.length < 20 || title.includes('Veja mais') || title.includes('Saiba mais')) {
      continue;
    }
    
    news.push({
      url,
      title,
      content: '',
      sourceSite: 'ge.globo.com',
    });
  }
  
  return news;
}

function extractNewsFromElGrafico(html: string, markdown: string): NewsItem[] {
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
    
    // Try to extract image from HTML
    let imageUrl: string | undefined;
    let imageCaption: string | undefined;
    let imageCredits: string | undefined;
    
    // Look for main article image
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))[^>]*>/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
      
      // Try to get alt text as caption
      const altMatch = imgMatch[0].match(/alt=["']([^"']+)["']/i);
      if (altMatch) {
        imageCaption = altMatch[1];
      }
    }
    
    // Look for figure with figcaption for credits
    const figureMatch = html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)[^>]*>[\s\S]*?<figcaption[^>]*>([^<]+)<\/figcaption>/i);
    if (figureMatch) {
      imageUrl = figureMatch[1];
      const captionText = figureMatch[2].trim();
      // Check if it contains credits (usually has "Foto:" or "Crédito:")
      if (captionText.includes('Foto:') || captionText.includes('Crédito:') || captionText.includes('Reprodução')) {
        imageCredits = captionText;
      } else {
        imageCaption = captionText;
      }
    }
    
    return { content, imageUrl, imageCaption, imageCredits };
  } catch (error) {
    console.error('Error scraping article:', url, error);
    return { content: '' };
  }
}

async function rewriteWithAI(title: string, content: string): Promise<{ rewrittenTitle: string; rewrittenContent: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Você é um jornalista esportivo da Fanaticamente. Reescreva a seguinte notícia de futebol com suas próprias palavras, mantendo as informações principais mas com um estilo único e envolvente. 

REGRAS:
1. Reescreva o título de forma criativa mas informativa
2. Reescreva o conteúdo mantendo os fatos principais
3. Use linguagem acessível e empolgante para fãs de futebol
4. O texto deve ser original e não uma cópia
5. Mantenha o texto conciso (máximo 300 palavras)
6. Responda APENAS no formato JSON especificado

TÍTULO ORIGINAL:
${title}

CONTEÚDO ORIGINAL:
${content}

Responda EXATAMENTE neste formato JSON:
{
  "rewrittenTitle": "seu título reescrito aqui",
  "rewrittenContent": "seu conteúdo reescrito aqui"
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
        { role: 'system', content: 'Você é um jornalista esportivo. Sempre responda em JSON válido.' },
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
    // Try to extract JSON from the response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        rewrittenTitle: parsed.rewrittenTitle || title,
        rewrittenContent: parsed.rewrittenContent || content,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', aiContent);
  }
  
  return { rewrittenTitle: title, rewrittenContent: content };
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

    // Scrape sources (El Gráfico temporarily disabled)
    const sources = [
      { url: 'https://ge.globo.com/futebol/', extractor: extractNewsFromGE },
      // { url: 'https://www.elgrafico.com.ar/seccion/4/futbol', extractor: extractNewsFromElGrafico },
    ];

    const allNews: NewsItem[] = [];

    for (const source of sources) {
      try {
        console.log(`Scraping ${source.url}...`);
        const result = await scrapeWithFirecrawl(source.url);
        const data = result.data || result;
        const markdown = data.markdown || '';
        const html = data.html || '';
        
        const news = source.extractor(html, markdown);
        console.log(`Found ${news.length} articles from ${source.url}`);
        allNews.push(...news);
      } catch (error) {
        console.error(`Error scraping ${source.url}:`, error);
      }
    }

    // Check which URLs already exist
    const { data: existingNews } = await supabase
      .from('football_news')
      .select('original_url')
      .in('original_url', allNews.map(n => n.url));

    const existingUrls = new Set(existingNews?.map(n => n.original_url) || []);
    const newArticles = allNews.filter(n => !existingUrls.has(n.url));

    console.log(`${newArticles.length} new articles to process`);

    // Process up to 3 new articles at a time to avoid rate limits
    const articlesToProcess = newArticles.slice(0, 3);
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
