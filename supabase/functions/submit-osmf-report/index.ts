import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for",
};

// In-memory rate limiting (resets on function cold start)
// For production, consider using Redis or database-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 5; // Max submissions per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback to a hash of user-agent + timestamp bucket (less reliable)
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `ua-${userAgent.substring(0, 50)}`;
}

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);

  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  // Increment count
  record.count++;
  rateLimitMap.set(clientIP, record);
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

// Clean up old entries periodically (basic memory management)
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      console.log(`[submit-osmf-report] Rate limit exceeded for IP: ${clientIP.substring(0, 20)}...`);
      return new Response(
        JSON.stringify({
          error: "Limite de envios excedido. Por favor, aguarde antes de enviar outro relato.",
          retryAfter: Math.ceil(rateCheck.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateCheck.resetIn / 1000)),
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      submit_type,
      content,
      emotions,
      club_id,
      location_text,
      is_anonymous,
      contact_name,
      contact_email,
      attachment_paths,
    } = body;

    // Server-side validation
    if (!submit_type || typeof submit_type !== "string") {
      return new Response(JSON.stringify({ error: "Tipo de envio inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Conteúdo é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Content length validation (max 10KB)
    if (content.length > 10240) {
      return new Response(JSON.stringify({ error: "Conteúdo muito longo (máximo 10KB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email format validation if provided
    if (contact_email && typeof contact_email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact_email)) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate emotions array
    if (emotions && !Array.isArray(emotions)) {
      return new Response(JSON.stringify({ error: "Emoções devem ser uma lista" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate attachment_paths array
    if (attachment_paths && !Array.isArray(attachment_paths)) {
      return new Response(JSON.stringify({ error: "Anexos devem ser uma lista" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for insertion
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Insert the report
    const { data, error } = await supabaseAdmin.from("osmf_reports").insert({
      submit_type: String(submit_type).substring(0, 100),
      content: String(content).substring(0, 10240),
      emotions: Array.isArray(emotions) ? emotions.slice(0, 20).map((e) => String(e).substring(0, 50)) : [],
      club_id: club_id ? String(club_id).substring(0, 50) : null,
      location_text: location_text ? String(location_text).substring(0, 200) : null,
      is_anonymous: is_anonymous !== false,
      contact_name: contact_name ? String(contact_name).substring(0, 100) : null,
      contact_email: contact_email ? String(contact_email).substring(0, 254) : null,
      attachment_paths: Array.isArray(attachment_paths) ? attachment_paths.slice(0, 10).map((p) => String(p).substring(0, 500)) : [],
    }).select().single();

    if (error) {
      console.error("[submit-osmf-report] Database error:", error);
      return new Response(JSON.stringify({ error: "Erro ao salvar relato. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cleanup old rate limit entries
    cleanupRateLimitMap();

    console.log(`[submit-osmf-report] Report submitted successfully. ID: ${data.id}, Remaining: ${rateCheck.remaining}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Relato enviado com sucesso",
        id: data.id,
        remaining_submissions: rateCheck.remaining,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[submit-osmf-report] Error:", errorMessage);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
