import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Store URLs to scrape
const STORE_URLS = [
  {
    clubId: "palmeiras",
    name: "Palmeiras",
    url: "https://www.palmeirasstore.com/uniforme-de-jogo/masculino/camisa-I",
  },
  {
    clubId: "flamengo",
    name: "Flamengo",
    url: "https://loja.flamengo.com.br/camisas-e-mantos",
  },
  {
    clubId: "corinthians",
    name: "Corinthians",
    url: "https://www.shoptimao.com.br/lst/home-24?tipo-de-produto=camisas-de-time",
  },
  {
    clubId: "sao-paulo",
    name: "São Paulo",
    url: "https://www.saostore.com.br/lst/sp-nb-1?genero=masculino",
  },
];

interface ScrapedProduct {
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  clubId: string;
}

async function scrapeStore(
  apiKey: string,
  clubId: string,
  storeUrl: string
): Promise<ScrapedProduct[]> {
  console.log(`Scraping store for ${clubId}: ${storeUrl}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: storeUrl,
        formats: ["markdown", "links"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to scrape ${clubId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || "";
    const links = data?.data?.links || [];

    // Extract product information from markdown
    const products: ScrapedProduct[] = [];

    // Parse product links and prices from markdown
    const productLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+\/p)\)/g;
    const priceRegex = /R\$\s*([\d.,]+)/g;

    let match;
    while ((match = productLinkRegex.exec(markdown)) !== null) {
      const name = match[1].replace(/View product details for /gi, "").trim();
      const productUrl = match[2];

      // Skip non-product links
      if (
        name.length < 5 ||
        name.includes("Adicionar") ||
        name.includes("carrinho")
      ) {
        continue;
      }

      // Try to extract price near this product
      const priceMatch = priceRegex.exec(markdown);
      const price = priceMatch
        ? parseFloat(priceMatch[1].replace(".", "").replace(",", "."))
        : 0;

      if (price > 0 && name.toLowerCase().includes("camisa")) {
        products.push({
          name,
          price,
          productUrl,
          imageUrl: "", // Will be fetched from product page
          clubId,
        });
      }
    }

    console.log(`Found ${products.length} products for ${clubId}`);
    return products.slice(0, 10); // Limit to 10 products per store
  } catch (error) {
    console.error(`Error scraping ${clubId}:`, error);
    return [];
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate and require admin/developer role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "developer"]);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - admin or developer role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting daily product update...");

    const allProducts: ScrapedProduct[] = [];

    // Scrape each store
    for (const store of STORE_URLS) {
      const products = await scrapeStore(apiKey, store.clubId, store.url);
      allProducts.push(...products);
    }

    console.log(`Total products scraped: ${allProducts.length}`);

    // For now, just log the results - in a full implementation,
    // this would update a database table
    return new Response(
      JSON.stringify({
        success: true,
        message: "Product update completed",
        productsScraped: allProducts.length,
        stores: STORE_URLS.map((s) => s.clubId),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in product update:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
