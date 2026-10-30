/**
 * Helpers for the legal-acceptance hash chain and its external RFC 3161
 * timestamp anchors. All functions run with the service-role client inside
 * edge functions; the underlying tables have RLS enabled with no policies,
 * so only the service role can reach them.
 */

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requestTrustedTimestamp, verifyStoredToken, bytesToHex } from "./rfc3161.ts";
import { bytesToBase64, base64ToBytes, sha256Hex } from "./legalReport.ts";

export interface ChainHead {
  seq: number;
  chain_hash: string;
  created_at: string;
}

export async function getChainHead(admin: SupabaseClient): Promise<ChainHead | null> {
  const { data, error } = await admin
    .from("legal_acceptance_chain")
    .select("seq, chain_hash, created_at")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ChainHead | null;
}

/**
 * Stamp one anchor row with an external TSA. Never throws: failures are
 * recorded on the row (status=failed, error, attempts+1) so they can be
 * retried later without losing the original acceptance.
 */
export async function stampAnchor(
  admin: SupabaseClient,
  anchor: { id: string; target_hash: string; attempts: number },
): Promise<{ stamped: boolean; genTimeIso?: string; tsaName?: string; error?: string }> {
  const result = await requestTrustedTimestamp(anchor.target_hash);
  if (!result.ok) {
    await admin
      .from("legal_chain_anchors")
      .update({ status: "failed", error: result.error ?? "unknown", attempts: anchor.attempts + 1 })
      .eq("id", anchor.id);
    return { stamped: false, error: result.error };
  }
  // PostgREST expects bytea as a "\x"-prefixed hex string; passing raw bytes
  // would JSON-serialize the array and corrupt the token.
  const tokenHex = "\\x" + bytesToHex(base64ToBytes(result.tokenBase64!));
  const { error } = await admin
    .from("legal_chain_anchors")
    .update({
      status: "stamped",
      tsa_url: result.tsaUrl,
      tsa_token: tokenHex,
      tsa_gen_time: result.genTimeIso,
      tsa_serial: result.serial,
      stamped_at: new Date().toISOString(),
      attempts: anchor.attempts + 1,
      error: null,
    })
    .eq("id", anchor.id);
  if (error) return { stamped: false, error: error.message };
  return { stamped: true, genTimeIso: result.genTimeIso, tsaName: result.tsaName };
}

/**
 * Anchor the current chain head with an external trusted timestamp.
 * Returns the anchor row id and the stamping outcome.
 */
export async function anchorChainHead(
  admin: SupabaseClient,
  opts: { anchorType: "chain_head" | "report_manifest"; targetHash?: string; reportId?: string } = { anchorType: "chain_head" },
): Promise<{ anchorId: string | null; stamped: boolean; genTimeIso?: string; tsaName?: string; error?: string }> {
  let targetHash = opts.targetHash;
  let headSeq: number | null = null;
  if (!targetHash) {
    const head = await getChainHead(admin);
    if (!head) return { anchorId: null, stamped: false, error: "chain is empty" };
    targetHash = head.chain_hash;
    headSeq = head.seq;
  } else {
    const head = await getChainHead(admin);
    headSeq = head?.seq ?? null;
  }

  const { data: anchor, error } = await admin
    .from("legal_chain_anchors")
    .insert({
      anchor_type: opts.anchorType,
      target_hash: targetHash,
      chain_head_seq: headSeq,
      report_id: opts.reportId ?? null,
    })
    .select("id, target_hash, attempts")
    .single();
  if (error) return { anchorId: null, stamped: false, error: error.message };

  const outcome = await stampAnchor(admin, anchor);
  return { anchorId: anchor.id, ...outcome };
}

/** Retry stamping pending/failed anchors (oldest first). */
export async function stampPendingAnchors(
  admin: SupabaseClient,
  limit = 10,
): Promise<{ processed: number; stamped: number; failed: number }> {
  const { data: rows, error } = await admin
    .from("legal_chain_anchors")
    .select("id, target_hash, attempts")
    .neq("status", "stamped")
    .lt("attempts", 8)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !rows) return { processed: 0, stamped: 0, failed: 0 };

  let stamped = 0;
  let failed = 0;
  for (const row of rows) {
    const outcome = await stampAnchor(admin, row);
    if (outcome.stamped) stamped++;
    else failed++;
  }
  return { processed: rows.length, stamped, failed };
}

export interface AnchorVerification {
  id: string;
  anchor_type: string;
  status: string;
  valid: boolean;
  gen_time?: string;
  tsa_url?: string;
  error?: string;
}

/** Re-validate every stamped anchor token against its target hash. */
export async function verifyAnchors(admin: SupabaseClient): Promise<AnchorVerification[]> {
  const { data: rows, error } = await admin
    .from("legal_chain_anchors")
    .select("id, anchor_type, status, target_hash, tsa_url, tsa_token, tsa_gen_time")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (rows ?? []).map((r) => {
    if (r.status !== "stamped" || !r.tsa_token) {
      return { id: r.id, anchor_type: r.anchor_type, status: r.status, valid: r.status === "pending" };
    }
    // supabase-js returns bytea as a hex string like "\\xABCD..."
    const raw: string = r.tsa_token as unknown as string;
    const hex = raw.startsWith("\\x") ? raw.slice(2) : raw;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const check = verifyStoredToken(bytesToBase64(bytes), r.target_hash);
    return {
      id: r.id,
      anchor_type: r.anchor_type,
      status: r.status,
      valid: check.valid,
      gen_time: r.tsa_gen_time ?? check.genTimeIso,
      tsa_url: r.tsa_url ?? undefined,
      error: check.error,
    };
  });
}

export { sha256Hex };

// ---------------------------------------------------------------------------
// Pure, testable audit core (no database access) + security event logging.
// ---------------------------------------------------------------------------

export interface ChainRowInput {
  seq: number;
  acceptance_id: string;
  record_payload: string;
  record_hash: string;
  prev_hash: string;
  chain_hash: string;
  created_at: string;
}

export interface ChainDivergence {
  seq: number | null;
  acceptance_id?: string;
  check: string;
  detail: string;
}

export const GENESIS_PREFIX = "GENESIS:";

/** Rebuild the canonical payload from an acceptance row (mirror of public.legal_acceptance_payload). */
export function buildAcceptancePayload(a: Record<string, unknown>): string {
  const clean = (v: unknown) => String(v ?? "-").replace(/\|/g, "/");
  const d = new Date(a.accepted_at as string);
  const iso = d.toISOString().replace(/(\.\d{3})\d*Z$/, "$1Z"); // millisecond precision, like to_char MS
  return [
    "v1",
    a.id,
    a.user_id,
    a.document_version_id,
    a.slug,
    String(a.version),
    a.content_sha256,
    a.action,
    clean(a.source),
    iso,
    a.ip_address ? String(a.ip_address) : "-",
    a.ip_source ? String(a.ip_source) : "-",
    clean(a.user_agent),
  ].join("|");
}

/**
 * Recompute every hash and validate chain continuity, sequence, chronology
 * and source-table consistency. Pure function: all data is passed in, so it
 * can be unit-tested with fabricated rows without touching real records.
 */
export async function auditChainRows(
  chain: ChainRowInput[],
  sourceById: Map<string, Record<string, unknown>>,
  totalAcceptances: number,
): Promise<ChainDivergence[]> {
  const divergences: ChainDivergence[] = [];
  let prevChainHash: string | null = null;
  let prevSeq = 0;
  let prevCreatedAt: string | null = null;

  for (const row of chain) {
    const recomputedRecord = await sha256Hex(row.record_payload);
    if (recomputedRecord !== row.record_hash) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "record_hash", detail: "o hash do registro não corresponde ao conteúdo armazenado" });
    }
    const recomputedChain = await sha256Hex(`${row.record_hash}|${row.prev_hash}`);
    if (recomputedChain !== row.chain_hash) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "chain_hash", detail: "o hash encadeado não corresponde à combinação registrada" });
    }
    if (prevChainHash === null) {
      if (!row.prev_hash.startsWith(GENESIS_PREFIX)) {
        divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "genesis", detail: "o primeiro registro não carrega o marco inicial" });
      }
    } else if (row.prev_hash !== prevChainHash) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "continuity", detail: "o elo com o registro anterior foi quebrado (alteração, exclusão ou inserção retroativa)" });
    }
    if (row.seq !== prevSeq + 1) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "sequence", detail: `salto de sequência: esperado ${prevSeq + 1}, encontrado ${row.seq}` });
    }
    if (prevCreatedAt && row.created_at < prevCreatedAt) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "chronology", detail: "registro fora da ordem cronológica" });
    }
    prevChainHash = row.chain_hash;
    prevSeq = row.seq;
    prevCreatedAt = row.created_at;
  }

  for (const row of chain) {
    const source = sourceById.get(row.acceptance_id);
    if (!source) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "source_missing", detail: "o registro de aceite original não existe mais" });
      continue;
    }
    if (buildAcceptancePayload(source) !== row.record_payload) {
      divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "source_tampered", detail: "o registro de aceite atual difere do conteúdo selado na cadeia" });
    }
  }

  if (totalAcceptances !== chain.length) {
    divergences.push({ seq: null, check: "coverage", detail: `existem ${totalAcceptances} aceites mas ${chain.length} registros na cadeia` });
  }

  return divergences;
}

export type SecuritySeverity = "info" | "warning" | "critical";

/**
 * Append-only technical security event log. Never include passwords, auth
 * tokens, private keys, clinical content or unnecessary personal data in
 * `detail` — keep it to technical metadata (counts, hashes, status codes).
 * Fire-and-forget by design: logging must never break the main flow.
 */
export function logSecurityEvent(
  admin: SupabaseClient,
  eventType: string,
  severity: SecuritySeverity,
  detail: Record<string, unknown> = {},
): void {
  admin
    .from("legal_security_events")
    .insert({ event_type: eventType, severity, detail })
    .then(({ error }) => {
      if (error) console.error("[legal-security-events] insert failed", error.message);
    });
}
