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
