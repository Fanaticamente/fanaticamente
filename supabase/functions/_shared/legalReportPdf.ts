import { PDFDocument, PDFFont, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import type { ReportRow } from "./legalReport.ts";

export interface PdfReportMeta {
  reportId: string;
  generatedAt: string;
  filterLabel: string;
  verificationCode: string;
  chain: { head_hash: string; head_seq: number } | null;
}

// Document-only palette, independent of the application's theme.
const ink = rgb(0.12, 0.16, 0.18);
const muted = rgb(0.36, 0.40, 0.42);
const border = rgb(0.78, 0.82, 0.82);
const band = rgb(0.93, 0.96, 0.95);
const accent = rgb(0.08, 0.38, 0.29);
const labels: Record<string, string> = {
  "terms-of-use": "Termos de Uso (Torcedor)",
  "privacy-policy": "Política de Privacidade (Torcedor)",
  "terms-of-use-professional": "Termos de Uso (Profissional)",
  "privacy-policy-professional": "Política de Privacidade (Profissional)",
};

function supportedText(value: unknown, font: PDFFont): string {
  return Array.from(String(value ?? "Não informado")).map((character) => {
    if (/\s/.test(character)) return " ";
    try { font.encodeText(character); return character; } catch { return "?"; }
  }).join("");
}

function wrap(value: unknown, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of supportedText(value, font).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
    if (line) lines.push(line);
    line = "";
    for (const character of word) {
      if (font.widthOfTextAtSize(line + character, size) > width) { lines.push(line); line = ""; }
      line += character;
    }
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

/** Boxed A4 report. The caller hashes these final bytes before signing the manifest. */
export async function buildOrganizedPdf(rows: ReportRow[], meta: PdfReportMeta): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle("Relatório de comprovação de aceite eletrônico");
  pdf.setAuthor("Fanaticamente Tecnologia");
  pdf.setCreationDate(new Date(meta.generatedAt));
  pdf.setModificationDate(new Date(meta.generatedAt));
  let page = pdf.addPage([595.28, 841.89]);
  let y = 0;
  const text = (value: string, x: number, top: number, size = 10, strong = false) => {
    page.drawText(supportedText(value, regular), { x, y: top - size, size, font: strong ? bold : regular, color: ink });
  };
  const startPage = () => {
    text("FANATICAMENTE TECNOLOGIA", 40, 804, 10, true);
    page.drawLine({ start: { x: 40, y: 781 }, end: { x: 555, y: 781 }, thickness: 1.5, color: accent });
    text("Comprovação de aceite eletrônico", 40, 769, 19, true);
    text(`Relatório ${meta.reportId}`, 40, 739, 8);
    y = 718;
  };
  const ensure = (height: number) => {
    if (y - height <  sixty()) { page = pdf.addPage([595.28, 841.89]); startPage(); }
  };
  function sixty() { return 60; }
  const section = (title: string, fields: [string, unknown][]) => {
    ensure(70);
    const heading = () => {
      page.drawRectangle({ x: 40, y: y - 25, width: 515, height: 25, color: band, borderColor: border, borderWidth: 0.6 });
      text(title, 50, y - 6, 10, true);
      y -= 25;
    };
    heading();
    for (const [label, value] of fields) {
      const lines = wrap(value, regular, 9, 348);
      // Split exceptionally long fields across pages, never truncate evidence.
      while (lines.length) {
        if (y - 30 < 60) { page = pdf.addPage([595.28, 841.89]); startPage(); heading(); }
        const count = Math.max(1, Math.min(lines.length, Math.floor((y - 60 - 14) / 13)));
        const chunk = lines.splice(0, count);
        const height = Math.max(29, chunk.length * 13 + 14);
        page.drawRectangle({ x: 40, y: y - height, width: 515, height, borderColor: border, borderWidth: 0.6 });
        page.drawLine({ start: { x: 188, y }, end: { x: 188, y: y - height }, color: border, thickness: 0.6 });
        text(label, 50, y - 8, 9, true);
        chunk.forEach((line, index) => text(line, 198, y - 8 - index * 13, 9));
        y -= height;
      }
    }
    y -= 14;
  };
  startPage();
  section("Identificação do relatório", [
    ["Emissão (UTC)", meta.generatedAt], ["Abrangência", meta.filterLabel], ["Total de aceites", rows.length],
    ["Código de verificação", meta.verificationCode],
    ["Consulta pública", `https://www.fanaticamente.com/verificar-documento?codigo=${meta.verificationCode}`],
  ]);
  section("Integridade e comprovação", [
    ["Assinatura", "Ed25519 sobre o manifesto e os hashes SHA-256 dos arquivos. Conserve o arquivo .assinatura.json junto com este PDF."],
    ["Carimbo do tempo", "O estado e a evidência do carimbo RFC 3161 constam no manifesto assinado e na consulta pública; a emissão pode ocorrer com carimbo pendente."],
    ["Sequência da cadeia", meta.chain?.head_seq ?? "Indisponível nesta emissão"],
    ["Hash da cadeia", meta.chain?.head_hash ?? "Indisponível nesta emissão"],
    ["Alcance da evidência", "Evidência técnica de aceite. Não constitui, por si só, garantia de validade jurídica absoluta."],
  ]);
  for (const [index, row] of rows.entries()) {
    ensure(130);
    section(`Aceite ${index + 1} de ${rows.length} — Identificação`, [
      ["Registro", row.id], ["Nome", row.full_name], ["E-mail", row.email], ["Usuário", row.user_id],
    ]);
    section("Documento e aceite", [
      ["Documento", labels[row.slug] ?? row.slug], ["Versão", row.version], ["Identificador da versão", row.document_version_id],
      ["SHA-256 integral", row.content_sha256], ["Data do aceite (UTC)", row.accepted_at], ["Ação", row.action], ["Origem", row.source],
    ]);
    section("Evidências técnicas registradas", [["Endereço IP", row.ip_address], ["Navegador / dispositivo", row.user_agent]]);
  }
  pdf.getPages().forEach((current, index, pages) => {
    current.drawText(`Fanaticamente • Uso restrito • Página ${index + 1} de ${pages.length}`, {
      x: 40, y: 28, size: 8, font: regular, color: muted,
    });
  });
  return pdf.save();
}