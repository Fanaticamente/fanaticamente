import { trustedClientIp } from "../_shared/trustedIp.ts";
import { stampPendingAnchors, logSecurityEvent } from "../_shared/legalChain.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_SLUGS = new Set([
  "terms-of-use",
  "privacy-policy",
  "terms-of-use-professional",
  "privacy-policy-professional",
]);
// "signup" is only recorded by the database from a server-created signup intent.
const ALLOWED_SOURCES = new Set(["reaccept_prompt"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // The user is derived ONLY from the verified session token.
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData?.user) {
      logSecurityEvent(admin, "acceptance_auth_failed", "warning", {});
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    // Only slugs + source are accepted from the client. Any date/version/hash sent is ignored.
    const slugs: unknown = body?.slugs;
    const source: unknown = body?.source;
    if (
      !Array.isArray(slugs) || slugs.length === 0 || slugs.length > 4 ||
      !slugs.every((s) => typeof s === "string" && ALLOWED_SLUGS.has(s))
    ) return json({ error: "Invalid slugs" }, 400);
    if (typeof source !== "string" || !ALLOWED_SOURCES.has(source)) {
      // A source outside the allowlist means the client tried to forge the
      // acceptance origin (the only legitimate client sends reaccept_prompt).
      logSecurityEvent(admin, "acceptance_source_forge_attempt", "critical", { user_id: userId });
      return json({ error: "Invalid source" }, 400);
    }

    // Server decides which current versions this user must accept.
    const { data: pending, error: pendErr } = await admin.rpc("get_pending_legal_documents", {
      _user_id: userId,
    });
    if (pendErr) throw pendErr;

    const pendingRows = (pending ?? []) as Array<{
      slug: string; version_id: string; version: number; content_sha256: string; previously_accepted: boolean;
    }>;
    const pendingSlugs = new Set(pendingRows.map((p) => p.slug));
    const requested = new Set(slugs as string[]);

    // All pending documents must be accepted together (both checkboxes).
    for (const s of pendingSlugs) {
      if (!requested.has(s)) return json({ error: "All required documents must be accepted", missing: s }, 400);
    }

    // The client must state which exact version ids it displayed. If any differs from the
    // current version (e.g. a new version was published while the window was open), refuse:
    // the user must reload and see the new text before agreeing. Ids are only compared,
    // never trusted: the recorded version/hash always come from the server lookup above.
    const shown: unknown = body?.version_ids;
    if (!shown || typeof shown !== "object" || Array.isArray(shown)) {
      return json({ error: "version_ids required", code: "version_mismatch" }, 409);
    }
    for (const p of pendingRows) {
      if ((shown as Record<string, unknown>)[p.slug] !== p.version_id) {
        logSecurityEvent(admin, "acceptance_version_mismatch", "info", { user_id: userId, slug: p.slug });
        return json({ error: "Displayed version is not the current version", code: "version_mismatch", slug: p.slug }, 409);
      }
    }

    const { ip, source: ipSource } = trustedClientIp(req.headers);
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 500) || null;

    const rows = pendingRows.map((p) => ({
      user_id: userId,
      document_version_id: p.version_id,
      slug: p.slug,
      version: p.version,
      content_sha256: p.content_sha256,
      action: p.previously_accepted ? "reaccept" : "accept",
      source,
      ip_address: ip,
      ip_source: ipSource,
      user_agent: ua,
    }));

    if (rows.length > 0) {
      const { error: insErr } = await admin.from("legal_acceptances").insert(rows);
      if (insErr) throw insErr;

      // The DB trigger already appended the records to the hash chain and
      // created pending timestamp anchors. Stamp them in the background,
      // best-effort: a TSA outage never blocks or loses the acceptance.
      const bg = stampPendingAnchors(admin, rows.length + 2).catch((e) =>
        console.error("[record-legal-acceptance] bg stamp failed", e)
      );
      (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime?.waitUntil?.(bg);
    }

    return json({ recorded: rows.length });
  } catch (e) {
    console.error("[record-legal-acceptance]", e);
    return json({ error: "Internal error" }, 500);
  }
});
