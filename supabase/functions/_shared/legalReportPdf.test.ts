import { assert, assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { buildOrganizedPdf } from "./legalReportPdf.ts";
import { buildManifest, sha256Hex, type ReportRow } from "./legalReport.ts";

const row: ReportRow = {
  id: "00000000-0000-0000-0000-000000000001", user_id: "usuario-ficticio",
  full_name: "João de Teste", email: "teste@example.invalid", slug: "terms-of-use", version: 3,
  content_sha256: "abc123".repeat(10) + "abcd", action: "accept", source: "reaccept_prompt",
  ip_address: null, user_agent: "Navegador fictício", accepted_at: "2026-10-30T21:00:00Z", document_version_id: "versao-ficticia",
};
const meta = {
  reportId: "relatorio-ficticio", generatedAt: "2026-10-30T21:49:00Z", filterLabel: "1 registro selecionado",
  verificationCode: "0123456789ABCDEFGHJKMNPQRSTV", chain: { head_seq: 12, head_hash: "a".repeat(64) },
};

Deno.test("manifesto cobre exatamente os bytes do PDF organizado", async () => {
  const bytes = await buildOrganizedPdf([row], meta);
  const manifest = await buildManifest({ reportId: meta.reportId, reportType: "individual", filters: {}, recordCount: 1,
    files: [{ name: "aceite.pdf", mime: "application/pdf", bytes }] });
  const files = manifest.files as { name: string; sha256: string }[];
  assertEquals(files[0].sha256, await sha256Hex(bytes));
  const modified = bytes.slice(); modified[modified.length - 1] ^= 1;
  assertNotEquals(files[0].sha256, await sha256Hex(modified));
});

Deno.test("código de verificação faz parte dos bytes protegidos", async () => {
  const first = await buildOrganizedPdf([row], meta);
  const second = await buildOrganizedPdf([row], { ...meta, verificationCode: "ZZZZZZZZZZZZZZZZZZZZZZZZZZ" });
  assertNotEquals(await sha256Hex(first), await sha256Hex(second));
});

Deno.test("PDF suporta registros extensos e relatório sem registros", async () => {
  const bytes = await buildOrganizedPdf([{ ...row, user_agent: "Informação longa ".repeat(800) }], meta);
  const loaded = await PDFDocument.load(bytes);
  assert(loaded.getPageCount() > 2);
  const empty = await PDFDocument.load(await buildOrganizedPdf([], meta));
  assert(empty.getPageCount() >= 1);
});