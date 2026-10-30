import { assertEquals, assertTrue } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  auditChainRows,
  buildAcceptancePayload,
  ChainRowInput,
  GENESIS_PREFIX,
} from "./legalChain.ts";
import { sha256Hex } from "./legalReport.ts";

// All data below is fabricated for tests — no real records are touched.

const ACCEPTANCE = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "22222222-2222-2222-2222-222222222222",
  document_version_id: "33333333-3333-3333-3333-333333333333",
  slug: "terms-of-use",
  version: 1,
  content_sha256: "aa".repeat(32),
  action: "accept",
  source: "signup",
  accepted_at: "2026-10-01T12:00:00.000Z",
  ip_address: "203.0.113.10",
  ip_source: "sb-forwarded-for",
  user_agent: "TestBrowser/1.0",
};

async function makeRow(seq: number, acceptance: Record<string, unknown>, prevHash: string, createdAt: string): Promise<ChainRowInput> {
  const payload = buildAcceptancePayload({ ...acceptance, accepted_at: createdAt });
  const recordHash = await sha256Hex(payload);
  return {
    seq,
    acceptance_id: acceptance.id as string,
    record_payload: payload,
    record_hash: recordHash,
    prev_hash: prevHash,
    chain_hash: await sha256Hex(`${recordHash}|${prevHash}`),
    created_at: createdAt,
  };
}

async function makeChain(n: number): Promise<{ chain: ChainRowInput[]; sources: Map<string, Record<string, unknown>> }> {
  const chain: ChainRowInput[] = [];
  const sources = new Map<string, Record<string, unknown>>();
  let prev = GENESIS_PREFIX + "00".repeat(32);
  for (let i = 1; i <= n; i++) {
    const acc = {
      ...ACCEPTANCE,
      id: `11111111-1111-1111-1111-${String(i).padStart(12, "0")}`,
      accepted_at: `2026-10-0${Math.min(i, 9)}T12:00:00.000Z`,
    };
    const row = await makeRow(i, acc, prev, acc.accepted_at);
    chain.push(row);
    sources.set(acc.id, { ...acc });
    prev = row.chain_hash;
  }
  return { chain, sources };
}

Deno.test("cadeia íntegra não produz divergências", async () => {
  const { chain, sources } = await makeChain(5);
  const d = await auditChainRows(chain, sources, 5);
  assertEquals(d, []);
});

Deno.test("detecta alteração do conteúdo de um registro antigo", async () => {
  const { chain, sources } = await makeChain(5);
  chain[2].record_payload = chain[2].record_payload.replace("accept", "forged");
  const d = await auditChainRows(chain, sources, 5);
  assertTrue(d.some((x) => x.check === "record_hash" && x.seq === 3));
  assertTrue(d.some((x) => x.check === "source_tampered" && x.seq === 3));
});

Deno.test("detecta exclusão de registro intermediário", async () => {
  const { chain, sources } = await makeChain(5);
  const removed = chain.splice(2, 1)[0];
  sources.delete(removed.acceptance_id);
  const d = await auditChainRows(chain, sources, 4);
  assertTrue(d.some((x) => x.check === "continuity"));
  assertTrue(d.some((x) => x.check === "sequence"));
});

Deno.test("detecta alteração da ordem cronológica", async () => {
  const { chain, sources } = await makeChain(5);
  // Swap created_at of two rows without changing linkage: order violation.
  chain[3].created_at = "2026-09-01T00:00:00.000Z";
  const d = await auditChainRows(chain, sources, 5);
  assertTrue(d.some((x) => x.check === "chronology" && x.seq === 4));
});

Deno.test("detecta quebra do elo com o registro anterior", async () => {
  const { chain, sources } = await makeChain(5);
  chain[3].prev_hash = "ff".repeat(32);
  const d = await auditChainRows(chain, sources, 5);
  assertTrue(d.some((x) => x.check === "continuity" && x.seq === 4));
  assertTrue(d.some((x) => x.check === "chain_hash" && x.seq === 4));
});

Deno.test("detecta aceite fora da cadeia (cobertura)", async () => {
  const { chain, sources } = await makeChain(3);
  const d = await auditChainRows(chain, sources, 4); // 4 acceptances, 3 chained
  assertTrue(d.some((x) => x.check === "coverage"));
});

Deno.test("detecta aceite original apagado da tabela fonte", async () => {
  const { chain, sources } = await makeChain(3);
  sources.clear();
  const d = await auditChainRows(chain, sources, 3);
  assertEquals(d.filter((x) => x.check === "source_missing").length, 3);
});

Deno.test("detecta adulteração da tabela fonte sem tocar a cadeia", async () => {
  const { chain, sources } = await makeChain(3);
  const tampered = sources.get(chain[1].acceptance_id)!;
  tampered.action = "reaccept"; // someone changed the source row
  const d = await auditChainRows(chain, sources, 3);
  assertTrue(d.some((x) => x.check === "source_tampered" && x.seq === 2));
});

Deno.test("payload canônico é determinístico e sanitiza pipes", () => {
  const a = buildAcceptancePayload({ ...ACCEPTANCE, user_agent: "a|b|c" });
  const b = buildAcceptancePayload({ ...ACCEPTANCE, user_agent: "a|b|c" });
  assertEquals(a, b);
  assertEquals(a.split("|").length, 13); // pipes inside fields are sanitized
  assertTrue(a.startsWith("v1|"));
});
