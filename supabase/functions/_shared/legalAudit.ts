import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  auditChainRows,
  ChainRowInput,
  getChainHead,
  logSecurityEvent,
  stampPendingAnchors,
  verifyAnchors,
} from "./legalChain.ts";

/**
 * Full server-side audit of the legal acceptance hash chain, shared by the
 * admin endpoint (verify-legal-chain) and the daily scheduled audit
 * (scheduled-legal-audit). Recomputes every hash, validates continuity,
 * sequence and chronology, cross-checks the source table, re-validates
 * every stored RFC 3161 token, records the run in legal_audit_runs
 * (append-only) and raises security events on divergence.
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
