import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { legalGate } from "../_shared/legalGate.ts";
import { logSecurityEvent } from "../_shared/legalChain.ts";
import {
  base64ToBytes,
  REPORT_ALGORITHM,
  REPORT_FORMAT_VERSION,
  sha256Hex,
  verifyManifestSignature,
} from "../_shared/legalReport.ts";

const BodySchema = z.object({
  manifest: z.record(z.unknown()),
  signature: z.string().min(1),
  files: z.array(z.object({ name: z.string().min(1), content_base64: z.string().min(1) })).min(1).max(10),
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

    // Administrative verification only (public verification by code comes later).
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { manifest, signature, files } = parsed.data;

    const checks: Record<string, boolean | string> = {};
    const m = manifest as Record<string, unknown>;

    // 1. Manifest structure and declared metadata.
    checks.format_version = m.format_version === REPORT_FORMAT_VERSION;
    checks.algorithm = m.algorithm === REPORT_ALGORITHM;
    checks.report_id = typeof m.report_id === "string" && m.report_id.length > 0;
    checks.generated_at = typeof m.generated_at === "string" && !Number.isNaN(Date.parse(m.generated_at as string));
    const keyId = typeof m.key_id === "string" ? m.key_id : "";

    // 2. Public key must exist and be active in the database.
    const { data: keyRow } = await admin
      .from("legal_report_keys")
      .select("public_key, is_active")
      .eq("key_id", keyId)
      .maybeSingle();
    checks.key_known = !!keyRow;
    checks.key_active = !!keyRow?.is_active;

    // 3. Every file declared in the manifest must be provided and match its SHA-256.
    const declared = Array.isArray(m.files) ? (m.files as { name: string; sha256: string }[]) : [];
    const provided = new Map(files.map((f) => [f.name, f.content_base64]));
    let filesOk = declared.length > 0 && declared.every((d) => provided.has(d.name));
    if (filesOk) {
      for (const d of declared) {
        const hash = await sha256Hex(base64ToBytes(provided.get(d.name)!));
        if (hash !== d.sha256) {
          filesOk = false;
          break;
        }
      }
    }
    checks.files_match = filesOk;

    // 4. Cryptographic signature over the canonical manifest.
    checks.signature_valid = keyRow
      ? await verifyManifestSignature(keyRow.public_key, m, signature)
      : false;

    const valid = Object.values(checks).every((v) => v === true);
    if (!valid) {
      logSecurityEvent(admin, "report_verification_failed", "critical", {
        failed_checks: Object.entries(checks).filter(([, v]) => v !== true).map(([k]) => k),
      });
    }

    await admin.from("legal_report_events").insert({
      report_id: checks.report_id === true ? (m.report_id as string) : "unknown",
      admin_user_id: user.id,
      action: "verify",
      verification_result: valid ? "valid" : "invalid",
      file_manifest: manifest,
      signature,
    });

    return json({ valid, checks });
  } catch (e) {
    console.error("[verify-legal-report] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
