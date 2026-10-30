import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, FileText, ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  themeStyles: { card: string; text: string; textMuted: string; border: string };
}

type Row = {
  id: string; user_id: string; full_name: string | null; email: string | null; slug: string;
  version: number; content_sha256: string; action: string; source: string;
  ip_address: string | null; user_agent: string | null; accepted_at: string; document_version_id: string;
};

const DOC_LABEL: Record<string, string> = {
  "terms-of-use": "Termos de Uso (Torcedor)",
  "privacy-policy": "Política de Privacidade (Torcedor)",
  "terms-of-use-professional": "Termos de Uso (Profissional)",
  "privacy-policy-professional": "Política de Privacidade (Profissional)",
};

const b64ToBytes = (b64: string) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const downloadBytes = (name: string, bytes: Uint8Array, mime: string) => {
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const fmt = (d: string) => format(new Date(d), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });

type VerifyResult = { valid: boolean; checks: Record<string, boolean | string> } | null;

const AdminLegalAcceptances = ({ themeStyles: t }: Props) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [openVersion, setOpenVersion] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult>(null);
  const [verifying, setVerifying] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [revokeCode, setRevokeCode] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeMsg, setRevokeMsg] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorMsg, setAnchorMsg] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);
  const { data: secEvents } = useQuery({
    queryKey: ["legal-security-events"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_legal_security_events", { _limit: 20 });
      if (error) return [];
      return (data ?? []) as { id: string; event_type: string; severity: string; detail: Record<string, unknown>; created_at: string }[];
    },
  });
  const { data: auditRuns } = useQuery({
    queryKey: ["legal-audit-runs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_legal_audit_runs", { _limit: 5 });
      if (error) return [];
      return (data ?? []) as { id: string; trigger_source: string; ok: boolean; records_checked: number; created_at: string }[];
    },
  });
  const [auditResult, setAuditResult] = useState<{
    ok: boolean;
    chain: { records_checked: number; head_seq: number | null };
    anchors: { total: number; stamped: number; pending: number; failed: number; invalid: number };
    divergences: { seq: number | null; check: string; detail: string }[];
  } | null>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ["admin-legal-acceptances", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_search_legal_acceptances", { _query: query.trim() });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: versionContent } = useQuery({
    queryKey: ["legal-version-content", openVersion],
    enabled: !!openVersion,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_document_versions").select("title, version, content_html, content_sha256, published_at")
        .eq("id", openVersion!).single();
      if (error) throw error;
      return data;
    },
  });

  const pick = (only?: Row[]) => only ?? (selected.size ? (rows ?? []).filter((r) => selected.has(r.id)) : rows ?? []);

  // Reports are generated and signed on the server; the browser only downloads the bytes.
  const serverReport = async (only?: Row[]) => {
    const target = pick(only);
    if (!target.length || busy) return;
    setBusy(true);
    setReportError(null);
    try {
      const isAll = !only && selected.size === 0;
      const { data, error } = await supabase.functions.invoke("generate-legal-report", {
        body: isAll
          ? { type: "general", formats: ["csv", "html", "pdf"] }
          : { type: "individual", acceptance_ids: target.map((r) => r.id), formats: ["csv", "html", "pdf"] },
      });
      if (error) throw error;
      if (!data?.manifest || !data?.signature || !Array.isArray(data?.files)) throw new Error("resposta inválida");
      setLastCode(data.verification_code ?? null);
      for (const f of data.files as { name: string; mime: string; content_base64: string }[]) {
        downloadBytes(f.name, b64ToBytes(f.content_base64), f.mime);
      }
      const sigJson = JSON.stringify({ manifest: data.manifest, signature: data.signature }, null, 2);
      downloadBytes(`relatorio-aceites-${data.manifest.report_id}.assinatura.json`, new TextEncoder().encode(sigJson), "application/json");
    } catch (e) {
      console.error(e);
      setReportError("Não foi possível gerar o relatório no servidor. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      let manifest: unknown = null;
      let signature: string | null = null;
      const reportFiles: { name: string; content_base64: string }[] = [];
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".assinatura.json")) {
          const parsed = JSON.parse(await file.text());
          manifest = parsed.manifest;
          signature = parsed.signature;
        } else {
          const buf = new Uint8Array(await file.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          reportFiles.push({ name: file.name, content_base64: btoa(bin) });
        }
      }
      if (!manifest || !signature || !reportFiles.length) {
        setVerifyResult({ valid: false, checks: { arquivos: "selecione o arquivo .assinatura.json e ao menos um arquivo do relatório" } });
        return;
      }
      const { data, error } = await supabase.functions.invoke("verify-legal-report", {
        body: { manifest, signature, files: reportFiles },
      });
      if (error) throw error;
      setVerifyResult(data as VerifyResult);
    } catch (e) {
      console.error(e);
      setVerifyResult({ valid: false, checks: { erro: "falha ao verificar no servidor" } });
    } finally {
      setVerifying(false);
      if (verifyInputRef.current) verifyInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${t.card} border ${t.border} rounded-xl p-4 md:p-6`}>
        <h2 className={`font-display text-xl ${t.text} mb-1`}>Comprovação de aceites</h2>
        <p className={`text-sm ${t.textMuted} mb-4`}>
          Registros imutáveis de aceite dos Termos de Uso e Políticas de Privacidade. Os relatórios são gerados e assinados
          no servidor (Ed25519) e baixados com um arquivo de assinatura para verificação. IP e navegador são mantidos por 5 anos.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(input); }} className="flex flex-wrap gap-2 mb-4">
          <div className={`flex-1 min-w-[220px] flex items-center gap-2 border ${t.border} rounded-lg px-3`}>
            <Search className={`w-4 h-4 ${t.textMuted}`} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nome, e-mail ou ID do usuário" className={`flex-1 h-10 bg-transparent text-sm outline-none ${t.text}`} />
          </div>
          <button type="submit" className="px-4 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Buscar</button>
          <button type="button" onClick={() => serverReport()} disabled={!rows?.length || busy} className={`inline-flex items-center gap-1 px-4 h-10 rounded-lg border ${t.border} ${t.text} text-sm disabled:opacity-40`}>
            <Download className="w-4 h-4" />{busy ? "Gerando..." : `Relatório assinado${selected.size ? ` (${selected.size})` : ""}`}
          </button>
          <button type="button" onClick={() => verifyInputRef.current?.click()} disabled={verifying} className={`inline-flex items-center gap-1 px-4 h-10 rounded-lg border ${t.border} ${t.text} text-sm disabled:opacity-40`}>
            <ShieldCheck className="w-4 h-4" />{verifying ? "Verificando..." : "Verificar relatório"}
          </button>
          <input ref={verifyInputRef} type="file" multiple accept=".json,.csv,.html,.pdf" className="hidden" onChange={(e) => onVerifyFiles(e.target.files)} />
        </form>

        {reportError && <p className="text-destructive text-sm mb-3">{reportError}</p>}
        {lastCode && (
          <div className={`mb-4 border border-emerald-500 rounded-lg p-3 text-sm`}>
            <p className={`font-semibold text-emerald-600`}>Relatório gerado e assinado no servidor.</p>
            <p className={`text-xs ${t.textMuted} mt-1`}>
              Código de verificação pública: <span className="font-mono font-semibold">{lastCode}</span> —
              qualquer pessoa pode conferir a autenticidade em <span className="font-mono">/verificar-documento</span> (sem ver dados pessoais).
            </p>
          </div>
        )}
        <div className={`mb-4 border ${t.border} rounded-lg p-3`}>
          <p className={`text-sm font-semibold ${t.text} mb-2`}>Revogar ou substituir relatório</p>
          <div className="flex flex-wrap gap-2">
            <input value={revokeCode} onChange={(e) => setRevokeCode(e.target.value.toUpperCase())} placeholder="Código do relatório" className={`flex-1 min-w-[180px] h-9 px-3 rounded-lg border ${t.border} bg-transparent text-xs font-mono ${t.text}`} maxLength={32} />
            <input value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Justificativa (obrigatória)" className={`flex-[2] min-w-[200px] h-9 px-3 rounded-lg border ${t.border} bg-transparent text-xs ${t.text}`} maxLength={500} />
            <button
              type="button"
              disabled={revoking || revokeCode.trim().length < 20 || revokeReason.trim().length < 5}
              onClick={async () => {
                setRevoking(true);
                setRevokeMsg(null);
                try {
                  const { data, error } = await supabase.functions.invoke("revoke-legal-report", {
                    body: { code: revokeCode.trim(), reason: revokeReason.trim() },
                  });
                  if (error) throw error;
                  setRevokeMsg(data?.ok ? "Relatório revogado. O histórico original foi preservado." : "Não foi possível revogar.");
                  if (data?.ok) { setRevokeCode(""); setRevokeReason(""); }
                } catch {
                  setRevokeMsg("Falha ao revogar. Confira o código e tente novamente.");
                } finally {
                  setRevoking(false);
                }
              }}
              className={`px-3 h-9 rounded-lg border ${t.border} ${t.text} text-xs disabled:opacity-40`}
            >
              {revoking ? "Revogando..." : "Revogar"}
            </button>
          </div>
          {revokeMsg && <p className={`text-xs ${t.textMuted} mt-2`}>{revokeMsg}</p>}
        </div>
        <div className={`mb-4 border ${t.border} rounded-lg p-3`}>
          <p className={`text-sm font-semibold ${t.text} mb-1`}>Cadeia de integridade e carimbo do tempo</p>
          <p className={`text-xs ${t.textMuted} mb-2`}>
            Cada aceite é selado em uma cadeia de hashes e ancorado com carimbo do tempo externo (RFC 3161).
            A auditoria recalcula todos os hashes no servidor e detecta alterações, exclusões ou inserções retroativas.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={anchoring}
              onClick={async () => {
                setAnchoring(true);
                setAnchorMsg(null);
                try {
                  const { data, error } = await supabase.functions.invoke("anchor-legal-chain", { body: {} });
                  if (error) throw error;
                  setAnchorMsg(
                    data?.anchor?.stamped
                      ? `Cabeça da cadeia (registro ${data.head.seq}) carimbada por ${data.anchor.tsa} em ${data.anchor.gen_time}. Pendentes: ${data.pending}.`
                      : `Carimbo não confirmado pela autoridade externa (${data?.anchor?.error ?? "erro"}). O registro permanece pendente para nova tentativa.`,
                  );
                } catch {
                  setAnchorMsg("Falha ao ancorar. Tente novamente.");
                } finally {
                  setAnchoring(false);
                }
              }}
              className={`px-3 h-9 rounded-lg border ${t.border} ${t.text} text-xs disabled:opacity-40`}
            >
              {anchoring ? "Ancorando..." : "Ancorar agora"}
            </button>
            <button
              type="button"
              disabled={auditing}
              onClick={async () => {
                setAuditing(true);
                setAuditResult(null);
                try {
                  const { data, error } = await supabase.functions.invoke("verify-legal-chain", { body: {} });
                  if (error) throw error;
                  setAuditResult(data);
                } catch {
                  setAuditResult(null);
                  setAnchorMsg("Falha ao auditar a cadeia. Tente novamente.");
                } finally {
                  setAuditing(false);
                }
              }}
              className={`px-3 h-9 rounded-lg border ${t.border} ${t.text} text-xs disabled:opacity-40`}
            >
              {auditing ? "Auditando..." : "Auditar cadeia"}
            </button>
          </div>
          {anchorMsg && <p className={`text-xs ${t.textMuted} mt-2`}>{anchorMsg}</p>}
          {auditRuns && auditRuns.length > 0 && (
            <div className={`mt-2 text-xs ${t.textMuted}`}>
              <p className={`font-semibold ${t.text} mb-1`}>Auditorias recentes (diária automática às 6h UTC + manuais)</p>
              <ul className="space-y-0.5">
                {auditRuns.map((r) => (
                  <li key={r.id}>
                    {fmt(r.created_at)} · {r.trigger_source === "cron" ? "automática" : "manual"} ·{" "}
                    {r.ok ? <span className="text-emerald-600 font-semibold">íntegra</span> : <span className="text-destructive font-semibold">divergência</span>}
                    {" "}· {r.records_checked} registros
                  </li>
                ))}
              </ul>
            </div>
          )}
          {secEvents && secEvents.length > 0 && (
            <div className={`mt-2 text-xs ${t.textMuted}`}>
              <p className={`font-semibold ${t.text} mb-1`}>Eventos de segurança recentes</p>
              <ul className="space-y-0.5">
                {secEvents.map((e) => (
                  <li key={e.id} className={e.severity === "critical" ? "text-destructive" : e.severity === "warning" ? "text-amber-600" : ""}>
                    {fmt(e.created_at)} · {e.event_type} · {e.severity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {auditResult && (
            <div className={`mt-2 border rounded-lg p-3 text-xs ${auditResult.ok ? "border-emerald-500" : "border-destructive"}`}>
              <p className={`font-semibold ${auditResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                {auditResult.ok
                  ? `Cadeia íntegra: ${auditResult.chain.records_checked} registros verificados, nenhuma divergência.`
                  : `Foram encontradas ${auditResult.divergences.length} divergência(s) na cadeia.`}
              </p>
              <p className={`${t.textMuted} mt-1`}>
                Âncoras: {auditResult.anchors.stamped} carimbadas, {auditResult.anchors.pending} pendentes, {auditResult.anchors.failed} com falha, {auditResult.anchors.invalid} inválidas.
              </p>
              {auditResult.divergences.length > 0 && (
                <ul className={`mt-1 space-y-0.5 ${t.textMuted}`}>
                  {auditResult.divergences.map((d, i) => (
                    <li key={i}>registro {d.seq ?? "—"} · {d.check}: {d.detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {verifyResult && (
          <div className={`mb-4 border rounded-lg p-3 text-sm ${verifyResult.valid ? "border-emerald-500" : "border-destructive"}`}>
            <p className={`inline-flex items-center gap-2 font-semibold ${verifyResult.valid ? "text-emerald-600" : "text-destructive"}`}>
              {verifyResult.valid ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {verifyResult.valid ? "Relatório autêntico: assinatura e conteúdo verificados no servidor." : "Verificação falhou: o relatório foi alterado ou não é autêntico."}
            </p>
            <ul className={`mt-2 text-xs ${t.textMuted} space-y-0.5`}>
              {Object.entries(verifyResult.checks).map(([k, v]) => (
                <li key={k}>{k}: {v === true ? "ok" : v === false ? "falhou" : String(v)}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading && <p className={t.textMuted}>Carregando...</p>}
        {error && <p className="text-destructive text-sm">Acesso negado ou erro ao carregar.</p>}
        {rows && rows.length === 0 && <p className={t.textMuted}>Nenhum registro encontrado.</p>}

        {!!rows?.length && (
          <div className={`flex flex-wrap items-center gap-3 mb-2 text-xs ${t.textMuted}`}>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-current" checked={selected.size === rows.length} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
              Selecionar todos
            </label>
            <span>{selected.size ? `${selected.size} selecionado(s) — o relatório baixa só os selecionados` : "Marque os cards para um relatório apenas com aceites específicos"}</span>
          </div>
        )}
        <div className="space-y-2">
          {rows?.map((r) => (
            <div key={r.id} className={`border ${t.border} rounded-lg p-3 text-sm`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex items-start gap-2">
                  <input type="checkbox" aria-label="Selecionar aceite" className="mt-1 w-4 h-4 accent-current cursor-pointer" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <div>
                    <p className={`font-semibold ${t.text}`}>{r.full_name || "Sem nome"}</p>
                    <p className={`text-xs ${t.textMuted}`}>{r.email} · {r.user_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={t.text}>{fmt(r.accepted_at)}</p>
                  <p className={`text-xs ${t.textMuted}`}>{r.action === "reaccept" ? "Novo aceite" : "Aceite"} · {r.source === "signup" ? "cadastro" : "atualização"}</p>
                </div>
              </div>
              <p className={`mt-2 ${t.text}`}>{DOC_LABEL[r.slug] ?? r.slug} — versão {r.version}</p>
              <p className={`font-mono text-xs break-all ${t.textMuted}`}>SHA-256: {r.content_sha256}</p>
              <p className={`text-xs ${t.textMuted} break-all`}>IP: {r.ip_address ?? "—"} · {r.user_agent ?? "—"}</p>
              <button onClick={() => setOpenVersion(openVersion === r.document_version_id ? null : r.document_version_id)} className="text-xs underline mt-1 text-secondary">
                {openVersion === r.document_version_id ? "Ocultar versão aceita" : "Ver versão exata aceita"}
              </button>
              <button onClick={() => serverReport([r])} disabled={busy} className={`ml-3 inline-flex items-center gap-1 text-xs underline mt-1 ${t.text} disabled:opacity-40`}><FileText className="w-3 h-3" />Baixar este aceite</button>
              {openVersion === r.document_version_id && versionContent && (
                <div className={`mt-2 border-t ${t.border} pt-2 max-h-80 overflow-auto`}>
                  <pre className={`whitespace-pre-wrap text-xs ${t.text}`}>{versionContent.content_html}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLegalAcceptances;
