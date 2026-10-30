import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { legalGate } from "../_shared/legalGate.ts";
import {
  buildCsv,
  buildHtml,
  buildManifest,
  buildPdf,
  bytesToBase64,
  pdfLines,
  ReportFile,
  ReportRow,
  signManifest,
} from "../_shared/legalReport.ts";

const BodySchema = z.object({
  type: z.enum(["general", "individual"]),
  acceptance_ids: z.array(z.string().uuid()).max(500).optional(),
  formats: z.array(z.enum(["csv", "html", "pdf"])).min(1).max(3).optional(),
});

const PAGE = 1000;

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

    // Auth: only authenticated admins may generate reports.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { type, acceptance_ids, formats } = parsed.data;
    if (type === "individual" && (!acceptance_ids || acceptance_ids.length === 0)) {
      return json({ error: { acceptance_ids: ["obrigatório para relatório individual"] } }, 400);
    }

    // Fetch every matching row directly from the database, paginating until exhausted.
    const rows: ReportRow[] = [];
    let offset = 0;
    for (;;) {
      const { data, error } = await admin.rpc("admin_legal_report_rows", {
        _ids: type === "individual" ? acceptance_ids : null,
        _offset: offset,
        _limit: PAGE,
      });
      if (error) {
        console.error("[generate-legal-report] query failed", error);
        return json({ error: "query_failed" }, 500);
      }
      const batch = (data ?? []) as ReportRow[];
      rows.push(...batch);
      if (batch.length < PAGE) break;
      offset += PAGE;
    }
    if (type === "individual" && rows.length === 0) return json({ error: "no_records" }, 404);

    const reportId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();
    const filterLabel = type === "individual" ? `${acceptance_ids!.length} registro(s) selecionado(s)` : "todos os registros";
    const meta = { reportId, generatedAt, filterLabel };

    const wanted = new Set(formats ?? ["csv", "html", "pdf"]);
    const files: ReportFile[] = [];
    if (wanted.has("csv")) files.push({ name: `relatorio-aceites-${reportId}.csv`, mime: "text/csv", bytes: buildCsv(rows) });
    if (wanted.has("html")) files.push({ name: `relatorio-aceites-${reportId}.html`, mime: "text/html", bytes: buildHtml(rows, meta) });
    if (wanted.has("pdf")) files.push({ name: `relatorio-aceites-${reportId}.pdf`, mime: "application/pdf", bytes: buildPdf(pdfLines(rows, meta)) });

    const manifest = await buildManifest({
      reportId,
      reportType: type,
      filters: type === "individual" ? { acceptance_ids: [...acceptance_ids!].sort() } : { scope: "all" },
      recordCount: rows.length,
      files,
    });
    const signature = await signManifest(manifest);

    // Append-only audit trail of report generation.
    const { error: evtError } = await admin.from("legal_report_events").insert({
      report_id: reportId,
      admin_user_id: user.id,
      action: "generate",
      report_type: type,
      record_count: rows.length,
      file_manifest: manifest,
      signature,
    });
    if (evtError) console.error("[generate-legal-report] event insert failed", evtError);

    return json({
      manifest,
      signature,
      files: files.map((f) => ({ name: f.name, mime: f.mime, content_base64: bytesToBase64(f.bytes) })),
    });
  } catch (e) {
    console.error("[generate-legal-report] unexpected", e);
    return json({ error: "internal_error" }, 500);
  }
});
