import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { legalGate } from "../_shared/legalGate.ts";
import { runFullAudit } from "../scheduled-legal-audit/index.ts";

/**
 * Admin-only server-side audit of the legal acceptance hash chain.
 * Delegates to the shared audit core (also used by the daily scheduled
 * audit): recomputes every hash, validates continuity/sequence/chronology,
 * cross-checks the source table, re-validates every stored RFC 3161 token
 * and records the run in legal_audit_runs.
 */
serve(async (req) => {
  {
    const __legalBlock = await legalGate(req);
    if (__legalBlock) return __legalBlock;
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    return json(await runFullAudit(admin, "admin"));
  } catch (e) {
    console.error("[verify-legal-chain] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
