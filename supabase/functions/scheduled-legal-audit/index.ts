import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  auditChainRows,
  ChainRowInput,
  getChainHead,
  logSecurityEvent,
  stampPendingAnchors,
  verifyAnchors,
} from "../_shared/legalChain.ts";
import { sha256Hex } from "../_shared/legalReport.ts";

/**
 * Scheduled legal audit (daily via pg_cron, or manual admin trigger through
 * verify-legal-chain). Authenticated by a shared cron secret: the database
 * sends the raw secret as Bearer; this function compares its SHA-256 against
 * the LEGAL_AUDIT_CRON_SECRET_SHA256 env var, so the raw secret never lives
 * in the function environment.
 *
 * Each run: retries pending timestamp anchors, re-audits the whole hash
 * chain and every stored token, records the outcome in legal_audit_runs
 * (append-only) and raises critical security events on any divergence.
 */

const PAGE = 1000;

export async function runFullAudit(admin: SupabaseClient, triggerSource: "cron" | "admin") {
  // 1. Retry pending/failed timestamp anchors first.
  const retries = await stampPendingAnchors(admin, 20);

  // 2. Load the full chain.
  const chain: ChainRowInput[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("legal_acceptance_chain")
      .select("seq, acceptance_id, record_payload, record_hash, prev_hash, chain_hash, created_at")
      .order("seq", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    chain.push(...((data ?? []) as ChainRowInput[]));
    if (!data || data.length < PAGE) break;
  }

  // 3. Load the source acceptances for cross-checking.
  const sourceById = new Map<string, Record<string, unknown>>();
  const ids = chain.map((r) => r.acceptance_id);
  for (let i = 0; i < ids.length; i += PAGE) {
    const { data, error } = await admin
      .from("legal_acceptances")
      .select("id, user_id, document_version_id, slug, version, content_sha256, action, source, accepted_at, ip_address, ip_source, user_agent")
      .in("id", ids.slice(i, i + PAGE));
    if (error) throw error;
    for (const r of data ?? []) sourceById.set(r.id, r as Record<string, unknown>);
  }
  const { count: totalAcceptances } = await admin
    .from("legal_acceptances")
    .select("id", { count: "exact", head: true });

  // 4. Pure audit core + anchor token validation.
  const divergences = await auditChainRows(chain, sourceById, totalAcceptances ?? 0);
  const anchors = await verifyAnchors(admin);
  const invalidAnchors = anchors.filter((a) => !a.valid && a.status === "stamped");
  for (const a of invalidAnchors) {
    divergences.push({ seq: null, check: "anchor_token", detail: `âncora ${a.id}: token inválido (${a.error ?? "erro desconhecido"})` });
  }

  const head = await getChainHead(admin);
  const anchorSummary = {
    total: anchors.length,
    stamped: anchors.filter((a) => a.status === "stamped").length,
    pending: anchors.filter((a) => a.status === "pending").length,
    failed: anchors.filter((a) => a.status === "failed").length,
    invalid: invalidAnchors.length,
    head_anchored: anchors.some((a) => a.anchor_type === "chain_head" && a.status === "stamped"),
    retries,
  };

  const ok = divergences.length === 0;

  // 5. Record the run (append-only) and raise events on divergence.
  await admin.from("legal_audit_runs").insert({
    trigger_source: triggerSource,
    ok,
    records_checked: chain.length,
    anchors: anchorSummary,
    divergences,
    error: null,
  });

  if (!ok) {
    logSecurityEvent(admin, "chain_audit_divergence", "critical", {
      trigger: triggerSource,
      divergence_count: divergences.length,
      checks: [...new Set(divergences.map((d) => d.check))],
    });
  }
  if (anchorSummary.failed > 0) {
    logSecurityEvent(admin, "timestamp_anchor_failed", "warning", { failed: anchorSummary.failed });
  }

  return {
    ok,
    audited_at: new Date().toISOString(),
    chain: { records_checked: chain.length, head_seq: head?.seq ?? null, head_hash: head?.chain_hash ?? null },
    anchors: anchorSummary,
    divergences,
  };
}

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
    // Cron-secret auth: compare SHA-256 of the presented secret.
    const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const expectedHash = Deno.env.get("LEGAL_AUDIT_CRON_SECRET_SHA256") ?? "";
    const presentedHash = presented ? await sha256Hex(presented) : "";
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
