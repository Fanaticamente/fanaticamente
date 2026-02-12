import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for context param to return course-specific or default key
    let publicKey: string | undefined;
    try {
      const body = await req.json();
      if (body?.context === "courses") {
        publicKey = Deno.env.get("MERCADOPAGO_COURSES_PUBLIC_KEY");
      }
    } catch {
      // No body or invalid JSON, use default
    }
    if (!publicKey) {
      publicKey = Deno.env.get("MERCADOPAGO_PUBLIC_KEY");
    }
    if (!publicKey) {
      throw new Error("MERCADOPAGO_PUBLIC_KEY is not configured");
    }

    return new Response(JSON.stringify({ publicKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GET-MERCADOPAGO-PUBLIC-KEY] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
