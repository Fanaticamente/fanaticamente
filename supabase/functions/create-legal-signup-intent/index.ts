import { trustedClientIp } from "../_shared/trustedIp.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const REQUIRED: Record<string, string[]> = {
  fan: ["terms-of-use", "privacy-policy"],
  pro: ["terms-of-use-professional", "privacy-policy-professional"],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sha256Hex = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

const emailBase = (email: string) => {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  return `${e.slice(0, at).split("+")[0]}@${e.slice(at + 1)}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const accountType = body?.account_type;
    const accepted = body?.accepted_slugs;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Invalid email" }, 400);
    if (accountType !== "fan" && accountType !== "pro") return json({ error: "Invalid account_type" }, 400);
    const required = REQUIRED[accountType];
    if (
      !Array.isArray(accepted) || accepted.length !== required.length ||
      !required.every((s) => accepted.includes(s)) ||
      body?.terms_accepted !== true || body?.privacy_accepted !== true
    ) return json({ error: "Both documents must be expressly accepted" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const base = emailBase(email);

    // Basic abuse limit per e-mail
    const { count } = await admin.from("legal_signup_intents").select("id", { count: "exact", head: true })
      .eq("email_base", base).gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= 10) return json({ error: "Too many attempts" }, 429);

    // Current versions are decided by the server, never by the browser.
    const { data: versions, error: vErr } = await admin.from("legal_document_versions")
      .select("id, slug, version").in("slug", required).order("version", { ascending: false });
    if (vErr) throw vErr;
    const current = required.map((s) => (versions ?? []).find((v) => v.slug === s));
    if (current.some((v) => !v)) return json({ error: "Legal documents unavailable" }, 503);

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { ip, source: ipSource } = trustedClientIp(req.headers);
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 500) || null;

    const { error: insErr } = await admin.from("legal_signup_intents").insert({
      token_sha256: await sha256Hex(token),
      email_base: base,
      account_type: accountType,
      document_version_ids: current.map((v) => v!.id),
      ip_address: ip,
      ip_source: ipSource,
      user_agent: ua,
    });
    if (insErr) throw insErr;

    return json({ token, versions: current.map((v) => ({ slug: v!.slug, version: v!.version })) });
  } catch (e) {
    console.error("[create-legal-signup-intent]", e);
    return json({ error: "Internal error" }, 500);
  }
});
