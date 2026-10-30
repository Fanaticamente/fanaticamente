import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { legalGate } from "../_shared/legalGate.ts";
import { anchorChainHead, getChainHead, stampPendingAnchors } from "../_shared/legalChain.ts";

/**
 * Admin-only: anchor the current chain head with an external RFC 3161
 * trusted timestamp and retry anchors that are still pending/failed.
 * Anchoring is additive and idempotent — it never touches historical rows.
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

    const head = await getChainHead(admin);
    if (!head) return json({ error: "chain_empty" }, 400);

    // Anchor the current head with a trusted external timestamp.
    const anchor = await anchorChainHead(admin, { anchorType: "chain_head" });

    // Retry pending/failed anchors (oldest first, bounded per invocation).
    const retries = await stampPendingAnchors(admin, 20);

    const { count: pendingCount } = await admin
      .from("legal_chain_anchors")
      .select("id", { count: "exact", head: true })
      .neq("status", "stamped");

    return json({
      head: { seq: head.seq, chain_hash: head.chain_hash },
      anchor: {
        id: anchor.anchorId,
        stamped: anchor.stamped,
        tsa: anchor.tsaName ?? null,
        gen_time: anchor.genTimeIso ?? null,
        error: anchor.error ?? null,
      },
      retries,
      pending: pendingCount ?? 0,
    });
  } catch (e) {
    console.error("[anchor-legal-chain] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
