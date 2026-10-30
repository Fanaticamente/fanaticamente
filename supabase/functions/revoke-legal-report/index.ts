import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { legalGate } from "../_shared/legalGate.ts";

/**
 * Admin-only revocation/substitution of a signed report. The original registry
 * row is preserved (content is immutable by trigger); only status fields change.
 */

const BodySchema = z.object({
  code: z.string().regex(/^[0-9A-Za-z]{20,32}$/),
  reason: z.string().min(5).max(500),
  superseded_by: z.string().regex(/^[0-9A-Za-z]{20,32}$/).optional(),
});

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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { code, reason, superseded_by } = parsed.data;
    const normalized = code.toUpperCase();

    const { data: reg } = await admin
      .from("legal_report_registry")
      .select("code, status, report_id")
      .eq("code", normalized)
      .maybeSingle();
    if (!reg) return json({ error: "not_found" }, 404);
    if (reg.status !== "valid") return json({ error: "already_not_valid", status: reg.status }, 409);

    if (superseded_by) {
      const { data: replacement } = await admin
        .from("legal_report_registry")
        .select("code, status")
        .eq("code", superseded_by.toUpperCase())
        .maybeSingle();
      if (!replacement || replacement.status !== "valid") {
        return json({ error: "replacement_not_valid" }, 400);
      }
    }

    const { error: upError } = await admin
      .from("legal_report_registry")
      .update({
        status: superseded_by ? "superseded" : "revoked",
        revoked_by: user.id,
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
        superseded_by: superseded_by?.toUpperCase() ?? null,
      })
      .eq("code", normalized);
    if (upError) {
      console.error("[revoke-legal-report] update failed", upError);
      return json({ error: "update_failed" }, 500);
    }

    await admin.from("legal_report_events").insert({
      report_id: reg.report_id,
      admin_user_id: user.id,
      action: "revoke",
      verification_result: superseded_by ? "superseded" : "revoked",
      file_manifest: { code: normalized, reason, superseded_by: superseded_by?.toUpperCase() ?? null },
    });

    return json({ ok: true, status: superseded_by ? "superseded" : "revoked" });
  } catch (e) {
    console.error("[revoke-legal-report] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
