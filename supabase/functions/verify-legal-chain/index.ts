import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { legalGate } from "../_shared/legalGate.ts";
import { sha256Hex } from "../_shared/legalReport.ts";
import { getChainHead, verifyAnchors } from "../_shared/legalChain.ts";

/**
 * Admin-only server-side audit of the legal acceptance hash chain.
 *
 * Recomputes every hash from the stored canonical payloads, validates chain
 * continuity (prev_hash linkage, sequence gaps, chronological order),
 * cross-checks each payload against the current legal_acceptances row
 * (detects tampering of the source table), re-validates every stored RFC
 * 3161 token, and compares the newest external anchor with the current
 * chain head. Runs entirely on the server.
 */

const GENESIS_PREFIX = "GENESIS:";
const PAGE = 1000;

interface ChainRow {
  seq: number;
  acceptance_id: string;
  record_payload: string;
  record_hash: string;
  prev_hash: string;
  chain_hash: string;
  created_at: string;
}

interface Divergence {
  seq: number | null;
  acceptance_id?: string;
  check: string;
  detail: string;
}

/** Rebuild the canonical payload from the current acceptance row (mirror of public.legal_acceptance_payload). */
function buildPayload(a: Record<string, unknown>): string {
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

    // ---- Load the full chain (paginated) ----
    const chain: ChainRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from("legal_acceptance_chain")
        .select("seq, acceptance_id, record_payload, record_hash, prev_hash, chain_hash, created_at")
        .order("seq", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      chain.push(...((data ?? []) as ChainRow[]));
      if (!data || data.length < PAGE) break;
    }

    const divergences: Divergence[] = [];
    let checked = 0;

    // ---- Per-record hash + continuity checks ----
    let prevChainHash: string | null = null;
    let prevSeq = 0;
    let prevCreatedAt: string | null = null;
    for (const row of chain) {
      checked++;

      const recomputedRecord = await sha256Hex(row.record_payload);
      if (recomputedRecord !== row.record_hash) {
        divergences.push({
          seq: row.seq,
          acceptance_id: row.acceptance_id,
          check: "record_hash",
          detail: "o hash do registro não corresponde ao conteúdo armazenado",
        });
      }

      const recomputedChain = await sha256Hex(`${row.record_hash}|${row.prev_hash}`);
      if (recomputedChain !== row.chain_hash) {
        divergences.push({
          seq: row.seq,
          acceptance_id: row.acceptance_id,
          check: "chain_hash",
          detail: "o hash encadeado não corresponde à combinação registrada",
        });
      }

      if (prevChainHash === null) {
        if (!row.prev_hash.startsWith(GENESIS_PREFIX)) {
          divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "genesis", detail: "o primeiro registro não carrega o marco inicial" });
        }
      } else if (row.prev_hash !== prevChainHash) {
        divergences.push({
          seq: row.seq,
          acceptance_id: row.acceptance_id,
          check: "continuity",
          detail: "o elo com o registro anterior foi quebrado (alteração, exclusão ou inserção retroativa)",
        });
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

    // ---- Cross-check stored payloads against the source table ----
    const acceptanceIds = chain.map((r) => r.acceptance_id);
    const sourceById = new Map<string, Record<string, unknown>>();
    for (let i = 0; i < acceptanceIds.length; i += PAGE) {
      const { data, error } = await admin
        .from("legal_acceptances")
        .select("id, user_id, document_version_id, slug, version, content_sha256, action, source, accepted_at, ip_address, ip_source, user_agent")
        .in("id", acceptanceIds.slice(i, i + PAGE));
      if (error) throw error;
      for (const r of data ?? []) sourceById.set(r.id, r as Record<string, unknown>);
    }
    for (const row of chain) {
      const source = sourceById.get(row.acceptance_id);
      if (!source) {
        divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "source_missing", detail: "o registro de aceite original não existe mais" });
        continue;
      }
      if (buildPayload(source) !== row.record_payload) {
        divergences.push({ seq: row.seq, acceptance_id: row.acceptance_id, check: "source_tampered", detail: "o registro de aceite atual difere do conteúdo selado na cadeia" });
      }
    }

    // ---- Orphan acceptances (inserted before the chain existed or trigger bypass) ----
    const { count: totalAcceptances } = await admin
      .from("legal_acceptances")
      .select("id", { count: "exact", head: true });
    if ((totalAcceptances ?? 0) !== chain.length) {
      divergences.push({
        seq: null,
        check: "coverage",
        detail: `existem ${totalAcceptances} aceites mas ${chain.length} registros na cadeia`,
      });
    }

    // ---- External timestamp anchors ----
    const anchors = await verifyAnchors(admin);
    const invalidAnchors = anchors.filter((a) => !a.valid && a.status === "stamped");
    for (const a of invalidAnchors) {
      divergences.push({ seq: null, check: "anchor_token", detail: `âncora ${a.id}: token inválido (${a.error ?? "erro desconhecido"})` });
    }

    const head = await getChainHead(admin);
    const latestHeadAnchor = anchors.filter((a) => a.anchor_type === "chain_head" && a.status === "stamped").pop();
    const headAnchored = !!latestHeadAnchor && !!head && latestHeadAnchor !== undefined;

    return json({
      ok: divergences.length === 0,
      audited_at: new Date().toISOString(),
      chain: {
        records_checked: checked,
        head_seq: head?.seq ?? null,
        head_hash: head?.chain_hash ?? null,
      },
      anchors: {
        total: anchors.length,
        stamped: anchors.filter((a) => a.status === "stamped").length,
        pending: anchors.filter((a) => a.status === "pending").length,
        failed: anchors.filter((a) => a.status === "failed").length,
        invalid: invalidAnchors.length,
        head_anchored: headAnchored,
      },
      divergences,
    });
  } catch (e) {
    console.error("[verify-legal-chain] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
