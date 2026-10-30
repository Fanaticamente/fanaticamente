/**
 * Server-side legal acceptance report generation and Ed25519 signing.
 * Private key lives ONLY in the LEGAL_REPORT_SIGNING_KEY secret; the public key
 * is stored in public.legal_report_keys for verification.
 */

export const REPORT_FORMAT_VERSION = "1.1";
export const REPORT_ALGORITHM = "Ed25519";
export const REPORT_KEY_ID = "legal-report-ed25519-2026-10";

export interface ReportRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  slug: string;
  version: number;
  content_sha256: string;
  action: string;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
  accepted_at: string;
  document_version_id: string;
}

export interface ReportFile {
  name: string;
  mime: string;
  bytes: Uint8Array;
}

/** Deterministic JSON serialization: object keys sorted recursively. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}

export async function sha256Hex(data: Uint8Array<ArrayBuffer> | string): Promise<string> {
  const bytes: Uint8Array<ArrayBuffer> = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(out);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Unique public verification code: 26 chars from a 32-symbol alphabet
 * (Crockford base32, no ambiguous 0/O/1/I/L), ~130 bits of crypto randomness.
 * Generated only server-side; never chosen by the browser.
 */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function generateVerificationCode(length = 26): string {
  const random = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[random[i] & 31];
  return out;
}

async function importPrivateKey(pkcs8B64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("pkcs8", base64ToBytes(pkcs8B64), { name: "Ed25519" }, false, ["sign"]);
}

export async function importPublicKey(spkiB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("spki", base64ToBytes(spkiB64), { name: "Ed25519" }, false, ["verify"]);
}

export async function signManifest(manifest: Record<string, unknown>): Promise<string> {
  const secret = Deno.env.get("LEGAL_REPORT_SIGNING_KEY");
  if (!secret) throw new Error("signing key not configured");
  const key = await importPrivateKey(secret);
  const bytes = new TextEncoder().encode(canonicalize(manifest));
  const sig = await crypto.subtle.sign("Ed25519", key, bytes);
  return bytesToBase64(new Uint8Array(sig));
}

export async function verifyManifestSignature(
  publicKeySpkiB64: string,
  manifest: Record<string, unknown>,
  signatureB64: string,
): Promise<boolean> {
  try {
    const key = await importPublicKey(publicKeySpkiB64);
    const bytes = new TextEncoder().encode(canonicalize(manifest));
    return await crypto.subtle.verify("Ed25519", key, base64ToBytes(signatureB64), bytes);
  } catch {
    return false;
  }
}

/** Canonical manifest signed for every report. Files sorted by name. */
export async function buildManifest(opts: {
  reportId: string;
  reportType: "general" | "individual";
  filters: Record<string, unknown>;
  recordCount: number;
  files: ReportFile[];
}): Promise<Record<string, unknown>> {
  const files = [];
  for (const f of [...opts.files].sort((a, b) => a.name.localeCompare(b.name))) {
    files.push({ name: f.name, sha256: await sha256Hex(f.bytes) });
  }
  return {
    algorithm: REPORT_ALGORITHM,
    files,
    filters: opts.filters,
    format_version: REPORT_FORMAT_VERSION,
    generated_at: new Date().toISOString(),
    key_id: REPORT_KEY_ID,
    record_count: opts.recordCount,
    report_id: opts.reportId,
    report_type: opts.reportType,
  };
}

const DOC_LABEL: Record<string, string> = {
  "terms-of-use": "Termos de Uso (Torcedor)",
  "privacy-policy": "Política de Privacidade (Torcedor)",
  "terms-of-use-professional": "Termos de Uso (Profissional)",
  "privacy-policy-professional": "Política de Privacidade (Profissional)",
};

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function buildCsv(rows: ReportRow[]): Uint8Array {
  const header = [
    "registro_id", "usuario_id", "nome", "email", "documento", "versao",
    "sha256_documento", "acao", "origem", "data_hora_servidor_utc", "ip", "user_agent",
  ];
  const lines = rows.map((r) =>
    [r.id, r.user_id, r.full_name, r.email, r.slug, r.version, r.content_sha256, r.action, r.source, r.accepted_at, r.ip_address, r.user_agent]
      .map(csvCell).join(",")
  );
  const body = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new TextEncoder().encode(body);
}

const esc = (s: unknown) =>
  String(s ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function buildHtml(rows: ReportRow[], meta: { reportId: string; generatedAt: string; filterLabel: string }): Uint8Array {
  const items = rows
    .map(
      (r) =>
        `<tr><td>${esc(r.full_name)}<br><small>${esc(r.email)}<br>${esc(r.user_id)}</small></td>` +
        `<td>${esc(DOC_LABEL[r.slug] ?? r.slug)}<br><small>v${r.version}</small></td>` +
        `<td><code>${esc(r.content_sha256)}</code></td>` +
        `<td>${esc(r.action)} / ${esc(r.source)}</td>` +
        `<td>${esc(r.accepted_at)}</td>` +
        `<td><small>${esc(r.ip_address)}<br>${esc(r.user_agent)}</small></td></tr>`,
    )
    .join("");
  const html =
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório de comprovação de aceite</title>` +
    `<style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}code{word-break:break-all;font-size:10px}</style>` +
    `<h1>Relatório de comprovação de aceite eletrônico</h1>` +
    `<p>Relatório ${esc(meta.reportId)} · gerado pelo servidor em ${esc(meta.generatedAt)} · filtro: ${esc(meta.filterLabel)} · registros: ${rows.length}.</p>` +
    `<p>As datas foram geradas pelo servidor no momento do aceite. O hash SHA-256 de cada documento corresponde ao conteúdo integral da versão aceita, conferível no histórico de versões. Este relatório é uma evidência técnica e não constitui, por si só, garantia de validade jurídica.</p>` +
    `<table><thead><tr><th>Usuário</th><th>Documento</th><th>SHA-256 do documento</th><th>Ação / origem</th><th>Data e hora (servidor)</th><th>Dados técnicos</th></tr></thead><tbody>${items}</tbody></table></html>`;
  return new TextEncoder().encode(html);
}

/** Minimal multi-page PDF (Helvetica, WinAnsi/Latin-1). All chars > 0xFF become '?'. */
export function buildPdf(lines: string[]): Uint8Array {
  const toLatin1 = (s: string) => {
    let out = "";
    for (const ch of s) out += (ch.codePointAt(0) ?? 0) <= 0xff ? ch : "?";
    return out;
  };
  const pdfEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const perPage = 46;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  if (!pages.length) pages.push([]);

  const fontObjNum = 3 + pages.length * 2;
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((pageLines, i) => {
    const pageNum = 3 + i * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${pageNum + 1} 0 R >>`,
    );
    const text = pageLines.map((l, j) => `BT /F1 9 Tf 40 ${800 - j * 16} Td (${pdfEscape(toLatin1(l))}) Tj ET`).join("\n");
    objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const out = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) out[i] = pdf.charCodeAt(i) & 0xff;
  return out;
}

export function pdfLines(rows: ReportRow[], meta: { reportId: string; generatedAt: string; filterLabel: string }): string[] {
  const lines: string[] = [
    "Relatorio de comprovacao de aceite eletronico",
    `Relatorio ${meta.reportId} - gerado pelo servidor em ${meta.generatedAt}`,
    `Filtro: ${meta.filterLabel} - Registros: ${rows.length}`,
    "Datas geradas pelo servidor no momento do aceite. O hash SHA-256 de cada documento",
    "corresponde ao conteudo integral da versao aceita. Evidencia tecnica, sem garantia",
    "juridica absoluta por si so.",
    "",
  ];
  for (const r of rows) {
    lines.push(`Registro: ${r.id}`);
    lines.push(`  Usuario: ${r.full_name ?? "-"} <${r.email ?? "-"}> (${r.user_id})`);
    lines.push(`  Documento: ${DOC_LABEL[r.slug] ?? r.slug} - versao ${r.version}`);
    lines.push(`  SHA-256: ${r.content_sha256}`);
    lines.push(`  Acao/origem: ${r.action} / ${r.source} - Data (servidor): ${r.accepted_at}`);
    lines.push(`  IP: ${r.ip_address ?? "-"} - UA: ${(r.user_agent ?? "-").slice(0, 90)}`);
    lines.push("");
  }
  return lines;
}
