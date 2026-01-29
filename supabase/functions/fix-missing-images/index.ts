import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeImageFromUrl(url: string, apiKey: string): Promise<{
  imageUrl?: string;
  imageCredits?: string;
}> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        onlyMainContent: false,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error for', url);
      return {};
    }

    const result = await response.json();
    const html = result.data?.html || result.html || '';
    
    let imageUrl: string | undefined;
    let imageCredits: string | undefined;
    
    // Helper to validate image URL
    const isValidImage = (url: string): boolean => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      // Skip small icons, logos, escudos, avatars
      if (lowerUrl.includes('logo') || 
          lowerUrl.includes('icon') || 
          lowerUrl.includes('avatar') ||
          lowerUrl.includes('escudo') ||
          lowerUrl.includes('badge') ||
          lowerUrl.includes('65x65') ||
          lowerUrl.includes('32x32') ||
          lowerUrl.includes('48x48') ||
          lowerUrl.includes('organizacoes')) {
        return false;
      }
      return true;
    };
    
    // Pattern 1: og:image meta tag (most reliable)
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch && isValidImage(ogImageMatch[1])) {
      imageUrl = ogImageMatch[1];
      console.log('Found og:image:', imageUrl);
    }
    
    // Pattern 2: twitter:image meta tag
    if (!imageUrl) {
      const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
      if (twitterImageMatch && isValidImage(twitterImageMatch[1])) {
        imageUrl = twitterImageMatch[1];
        console.log('Found twitter:image:', imageUrl);
      }
    }
    
    // Pattern 3: figure image with large dimensions
    if (!imageUrl) {
      const figureImgMatch = html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (figureImgMatch && isValidImage(figureImgMatch[1])) {
        imageUrl = figureImgMatch[1].split('?')[0];
        console.log('Found figure image:', imageUrl);
      }
    }
    
    // Pattern 4: data-src (lazy loaded images)
    if (!imageUrl) {
      const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (dataSrcMatch && isValidImage(dataSrcMatch[1])) {
        imageUrl = dataSrcMatch[1].split('?')[0];
        console.log('Found data-src image:', imageUrl);
      }
    }
    
    // Pattern 5: article main image
    if (!imageUrl) {
      const articleImgMatches = html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*>/gi);
      for (const match of articleImgMatches) {
        if (isValidImage(match[1])) {
          imageUrl = match[1].split('?')[0];
          console.log('Found article image:', imageUrl);
          break;
        }
      }
    }
    
    // Clean up URL
    if (imageUrl) {
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = urlObj.origin + imageUrl;
      }
    }
    
    // Extract credits
    const figcaptionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (figcaptionMatch) {
      let fullCaption = figcaptionMatch[1].replace(/<[^>]+>/g, '').trim();
      fullCaption = fullCaption.replace(/^\d+ de \d+\s*/i, '').trim();
      
      if (fullCaption.includes('—')) {
        const parts = fullCaption.split('—');
        const creditPart = parts.slice(1).join('—').trim();
        if (creditPart) {
          imageCredits = creditPart.replace(/^\d+ de \d+\s*/i, '').trim();
        }
      } else if (fullCaption.startsWith('Foto:')) {
        imageCredits = fullCaption;
      }
    }
    
    return { imageUrl, imageCredits };
  } catch (error) {
    console.error('Error scraping image from', url, error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find articles without images
    const { data: articlesWithoutImages, error: fetchError } = await supabase
      .from('football_news')
      .select('id, original_url, rewritten_title')
      .is('image_url', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${articlesWithoutImages?.length || 0} articles without images`);

    const updated: string[] = [];

    for (const article of articlesWithoutImages || []) {
      console.log(`Processing: ${article.rewritten_title}`);
      
      const { imageUrl, imageCredits } = await scrapeImageFromUrl(article.original_url, firecrawlApiKey);
      
      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('football_news')
          .update({ 
            image_url: imageUrl,
            image_credits: imageCredits || null
          })
          .eq('id', article.id);

        if (!updateError) {
          updated.push(article.rewritten_title);
          console.log(`Updated image for: ${article.rewritten_title}`);
        } else {
          console.error(`Failed to update: ${article.rewritten_title}`, updateError);
        }
      } else {
        console.log(`No image found for: ${article.rewritten_title}`);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: articlesWithoutImages?.length || 0,
        updated: updated.length,
        articles: updated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fix images error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
