import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Central server-side legal acceptance gate.
 * Returns a 403 Response when the request carries a valid end-user session whose
 * user still has required legal documents pending; otherwise null.
 * Requests without a user session (anon key, service role, webhooks, cron) pass through
 * so each function's own authentication logic still applies.
 */
export async function legalGate(req: Request): Promise<Response | null> {
  if (req.method === "OPTIONS") return null;
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let sub: string | undefined;
  try {
    const { data, error } = await admin.auth.getClaims(token);
    if (error || !data?.claims || data.claims.role !== "authenticated") return null;
    sub = data.claims.sub as string;
  } catch {
    return null; // not a user JWT; the function's own auth check decides
  }
  if (!sub) return null;

  const { data: pending, error } = await admin.rpc("get_pending_legal_documents", { _user_id: sub });
  if (error) {
    console.error("[legalGate] pending check failed", error);
    // Fail closed for authenticated users.
    return new Response(JSON.stringify({ error: "legal_check_unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (Array.isArray(pending) && pending.length > 0) {
    return new Response(
      JSON.stringify({ error: "legal_acceptance_required", pending: pending.map((p: any) => p.slug) }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}
