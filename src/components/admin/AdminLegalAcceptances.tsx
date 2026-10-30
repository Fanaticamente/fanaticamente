import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, FileText } from "lucide-react";
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

const sha256Hex = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const fmt = (d: string) => format(new Date(d), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });

const AdminLegalAcceptances = ({ themeStyles: t }: Props) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [openVersion, setOpenVersion] = useState<string | null>(null);

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

  const exportCsv = async () => {
    if (!rows?.length) return;
    const header = ["registro_id","usuario_id","nome","email","documento","versao","sha256_documento","acao","origem","data_hora_servidor_utc","ip","user_agent"];
    const lines = rows.map((r) => [r.id, r.user_id, r.full_name, r.email, r.slug, r.version, r.content_sha256, r.action, r.source, r.accepted_at, r.ip_address, r.user_agent].map(csvCell).join(","));
    const body = [header.join(","), ...lines].join("\n");
    const hash = await sha256Hex(body);
    const generated = new Date().toISOString();
    download(`aceites-${generated.slice(0, 10)}.csv`, `${body}\n\n# gerado_em,${generated}\n# sha256_do_conteudo_acima,${hash}\n`, "text/csv;charset=utf-8");
  };

  const exportReport = async () => {
    if (!rows?.length) return;
    const esc = (s: unknown) => String(s ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const items = rows.map((r) => `<tr><td>${esc(r.full_name)}<br><small>${esc(r.email)}<br>${esc(r.user_id)}</small></td><td>${esc(DOC_LABEL[r.slug] ?? r.slug)}<br><small>v${r.version}</small></td><td><code>${esc(r.content_sha256)}</code></td><td>${esc(r.action)} / ${esc(r.source)}</td><td>${esc(fmt(r.accepted_at))}<br><small>${esc(r.accepted_at)}</small></td><td><small>${esc(r.ip_address)}<br>${esc(r.user_agent)}</small></td></tr>`).join("");
    const table = `<table><thead><tr><th>Usuário</th><th>Documento</th><th>SHA-256 do documento</th><th>Ação / origem</th><th>Data e hora (servidor)</th><th>Dados técnicos</th></tr></thead><tbody>${items}</tbody></table>`;
    const hash = await sha256Hex(table);
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Relatório de comprovação de aceite</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}code{word-break:break-all;font-size:10px}</style><h1>Relatório de comprovação de aceite eletrônico</h1><p>Gerado em ${esc(new Date().toISOString())}. Filtro: ${esc(query || "todos")}. Registros: ${rows.length}.</p><p>As datas foram geradas pelo servidor no momento do aceite. O hash SHA-256 de cada documento corresponde ao conteúdo integral da versão aceita, conferível no histórico de versões. Este relatório é uma evidência técnica e não constitui, por si só, garantia de validade jurídica.</p>${table}<p>SHA-256 da tabela deste relatório: <code>${hash}</code></p></html>`;
    download(`relatorio-aceites-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8");
  };

  return (
    <div className="space-y-4">
      <div className={`${t.card} border ${t.border} rounded-xl p-4 md:p-6`}>
        <h2 className={`font-display text-xl ${t.text} mb-1`}>Comprovação de aceites</h2>
        <p className={`text-sm ${t.textMuted} mb-4`}>
          Registros imutáveis de aceite dos Termos de Uso e Políticas de Privacidade. IP e navegador são mantidos por 5 anos para fins de comprovação e depois removidos automaticamente.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(input); }} className="flex flex-wrap gap-2 mb-4">
          <div className={`flex-1 min-w-[220px] flex items-center gap-2 border ${t.border} rounded-lg px-3`}>
            <Search className={`w-4 h-4 ${t.textMuted}`} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nome, e-mail ou ID do usuário" className={`flex-1 h-10 bg-transparent text-sm outline-none ${t.text}`} />
          </div>
          <button type="submit" className="px-4 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Buscar</button>
          <button type="button" onClick={exportCsv} disabled={!rows?.length} className={`inline-flex items-center gap-1 px-4 h-10 rounded-lg border ${t.border} ${t.text} text-sm disabled:opacity-40`}><Download className="w-4 h-4" />CSV</button>
          <button type="button" onClick={exportReport} disabled={!rows?.length} className={`inline-flex items-center gap-1 px-4 h-10 rounded-lg border ${t.border} ${t.text} text-sm disabled:opacity-40`}><FileText className="w-4 h-4" />Relatório</button>
        </form>

        {isLoading && <p className={t.textMuted}>Carregando...</p>}
        {error && <p className="text-destructive text-sm">Acesso negado ou erro ao carregar.</p>}
        {rows && rows.length === 0 && <p className={t.textMuted}>Nenhum registro encontrado.</p>}

        <div className="space-y-2">
          {rows?.map((r) => (
            <div key={r.id} className={`border ${t.border} rounded-lg p-3 text-sm`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className={`font-semibold ${t.text}`}>{r.full_name || "Sem nome"}</p>
                  <p className={`text-xs ${t.textMuted}`}>{r.email} · {r.user_id}</p>
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
