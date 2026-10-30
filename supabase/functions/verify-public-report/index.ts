import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { trustedClientIp } from "../_shared/trustedIp.ts";
import { canonicalize, sha256Hex, verifyManifestSignature } from "../_shared/legalReport.ts";

/**
 * PUBLIC report verification by unique code. No authentication.
 * Returns only minimal, non-personal metadata; the full report stays
 * restricted to admins. Verification is cryptographic: the stored signed
 * manifest is re-verified with the public key on every lookup.
 */

const BodySchema = z.object({
  code: z.string().regex(/^[0-9A-Za-z]{20,32}$/, "código inválido"),
});

// Ad-hoc attempt limiting (no platform rate-limit primitive exists):
// max 30 lookups per IP per hour, best-effort under concurrency.
const MAX_ATTEMPTS_PER_HOUR = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { ip } = trustedClientIp(req.headers);

  const logAttempt = (code: string | null, result: string) =>
    admin.from("legal_report_verify_log").insert({ code_attempted: code, result, ip }).then(
      () => undefined,
      (e) => console.error("[verify-public-report] log failed", e),
    );

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ status: "not_found" }, 200);
    const code = parsed.data.code.toUpperCase();

    // Attempt limiting per IP (best-effort, ad-hoc).
    if (ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("legal_report_verify_log")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
        await logAttempt(code, "rate_limited");
        return json({ error: "too_many_requests" }, 429);
      }
    }

    const { data: reg, error } = await admin
      .from("legal_report_registry")
      .select("code, report_id, manifest, manifest_sha256, signature, key_id, report_type, record_count, generated_at, status, revoked_at, revocation_reason, superseded_by")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[verify-public-report] lookup failed", error);
      return json({ error: "verification_unavailable" }, 503);
    }
    if (!reg) {
      await logAttempt(code, "not_found");
      return json({ status: "not_found" });
    }

    const base = {
      report_id: reg.report_id,
      generated_at: reg.generated_at,
      record_count: reg.record_count,
      report_type: reg.report_type,
      key_id: reg.key_id,
    };

    if (reg.status === "revoked") {
      await logAttempt(code, "revoked");
      return json({ status: "revoked", ...base, revoked_at: reg.revoked_at, revocation_reason: reg.revocation_reason });
    }
    if (reg.status === "superseded") {
      await logAttempt(code, "superseded");
      return json({ status: "superseded", ...base, superseded_by: reg.superseded_by });
    }

    // Cryptographic verification of the stored signed manifest.
    const { data: keyRow } = await admin
      .from("legal_report_keys")
      .select("public_key, is_active")
      .eq("key_id", reg.key_id)
      .maybeSingle();

    const manifestHashOk = (await sha256Hex(canonicalize(reg.manifest))) === reg.manifest_sha256;
    const signatureOk =
      !!keyRow?.is_active &&
      (await verifyManifestSignature(keyRow.public_key, reg.manifest as Record<string, unknown>, reg.signature));
    const codeBound = (reg.manifest as Record<string, unknown>).verification_code === reg.code;

    if (!manifestHashOk || !signatureOk || !codeBound) {
      await logAttempt(code, "invalid_signature");
      return json({ status: "invalid_signature", ...base });
    }

    await logAttempt(code, "valid");
    return json({
      status: "valid",
      ...base,
      algorithm: (reg.manifest as Record<string, unknown>).algorithm,
      format_version: (reg.manifest as Record<string, unknown>).format_version,
    });
  } catch (e) {
    console.error("[verify-public-report] unexpected", e);
    return json({ error: "verification_unavailable" }, 503);
  }
});
