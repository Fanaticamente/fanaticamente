import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { runFullAudit } from "../_shared/legalAudit.ts";
import { logSecurityEvent } from "../_shared/legalChain.ts";
import { sha256Hex } from "../_shared/legalReport.ts";

/**
 * Daily scheduled legal audit (pg_cron -> legal_audit_dispatch -> here).
 * Authenticated by a shared cron secret: the database sends the raw secret
 * as Bearer; this function compares its SHA-256 against the
 * LEGAL_AUDIT_CRON_SECRET_SHA256 env var, so the raw secret never lives in
 * the function environment. Results are recorded in legal_audit_runs and
 * divergences raise critical security events.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    // Cron-secret auth: the expected secret lives only in the locked
    // legal_cron_config table (single source of truth, service-role only).
    // The presented Bearer token is compared by SHA-256 so the raw secret
    // never appears in logs or env vars.
    const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const { data: cfg } = await admin
      .from("legal_cron_config")
      .select("value")
      .eq("key", "audit_secret")
      .maybeSingle();
    const presentedHash = presented ? await sha256Hex(presented) : "";
    const expectedHash = cfg?.value ? await sha256Hex(cfg.value) : "";
    if (!expectedHash || !presentedHash || presentedHash !== expectedHash) {
      logSecurityEvent(admin, "scheduled_audit_unauthorized", "warning", {});
      return json({ error: "unauthorized" }, 401);
    }

    const result = await runFullAudit(admin, "cron");
    return json(result);
  } catch (e) {
    console.error("[scheduled-legal-audit] unexpected", e);
    logSecurityEvent(admin, "scheduled_audit_failure", "critical", {
      error: e instanceof Error ? e.message : String(e),
    });
    await admin.from("legal_audit_runs").insert({
      trigger_source: "cron",
      ok: false,
      records_checked: 0,
      anchors: {},
      divergences: [],
      error: e instanceof Error ? e.message : String(e),
    });
    return json({ error: "internal_error" }, 500);
  }
});
