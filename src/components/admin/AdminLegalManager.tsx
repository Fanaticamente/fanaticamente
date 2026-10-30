import { useEffect, useState } from "react";
import { Save, FileText, Scale, Users, Stethoscope } from "lucide-react";
import RichEditor from "@/components/marketing/RichEditor";
import { useLegalDocument, usePublishLegalVersion, useLegalVersions, type LegalSlug } from "@/hooks/useLegalDocument";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DEFAULT_PRIVACY_POLICY_USER_HTML,
  DEFAULT_PRIVACY_POLICY_PROFESSIONAL_HTML,
  DEFAULT_TERMS_OF_USE_HTML,
} from "@/lib/legalDefaults";

const DEFAULTS: Record<LegalSlug, string> = {
  "privacy-policy": DEFAULT_PRIVACY_POLICY_USER_HTML,
  "privacy-policy-professional": DEFAULT_PRIVACY_POLICY_PROFESSIONAL_HTML,
  "terms-of-use": DEFAULT_TERMS_OF_USE_HTML,
  "terms-of-use-professional": "",
};

const isEmptyHtml = (html: string) =>
  !html || html.replace(/<[^>]+>/g, "").trim().length === 0;

interface Props {
  themeStyles: {
    card: string;
    text: string;
    textMuted: string;
    border: string;
  };
}

const GROUPS: {
  system: string;
  subtitle: string;
  icon: typeof FileText;
  docs: { slug: LegalSlug; label: string; icon: typeof FileText }[];
}[] = [
  {
    system: "Fanaticamente — Torcedor",
    subtitle: "Documentos exibidos no cadastro do app do torcedor",
    icon: Users,
    docs: [
      { slug: "privacy-policy", label: "Política de Privacidade", icon: Scale },
      { slug: "terms-of-use", label: "Termos de Uso", icon: FileText },
    ],
  },
  {
    system: "FanaticaWork — Profissionais Parceiros",
    subtitle: "Documentos exibidos no cadastro do app profissional",
    icon: Stethoscope,
    docs: [
      { slug: "privacy-policy-professional", label: "Política de Privacidade", icon: Scale },
      { slug: "terms-of-use-professional", label: "Termos de Uso", icon: FileText },
    ],
  },
];

const AdminLegalManager = ({ themeStyles }: Props) => {
  const [activeSlug, setActiveSlug] = useState<LegalSlug>("privacy-policy");
  const { data, isLoading } = useLegalDocument(activeSlug);
  const update = usePublishLegalVersion();
  const { data: versions } = useLegalVersions(activeSlug);
  const [html, setHtml] = useState("");
  const [requiresReaccept, setRequiresReaccept] = useState(false);
  const [summary, setSummary] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    const stored = data?.content_html ?? "";
    setHtml(isEmptyHtml(stored) ? DEFAULTS[activeSlug] : stored);
  }, [activeSlug, data?.content_html]);

  const handleSave = async () => {
    try {
      const v = await update.mutateAsync({
        slug: activeSlug, content_html: html, requires_reacceptance: requiresReaccept, change_summary: summary,
      });
      toast.success(`Versão ${v.version} publicada${requiresReaccept ? " — novo aceite será solicitado" : ""}.`);
      setSummary(""); setRequiresReaccept(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar documento");
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4 md:p-6`}>
        <h2 className={`font-display text-xl ${themeStyles.text} mb-1`}>Documentos Jurídicos</h2>
        <p className={`text-sm ${themeStyles.textMuted} mb-4`}>
          Edite os textos apresentados aos profissionais e usuários no aceite dos termos.
          A data de atualização é registrada automaticamente e exibida no rodapé da página pública.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {GROUPS.map((g) => {
            const GroupIcon = g.icon;
            return (
              <div key={g.system} className={`border ${themeStyles.border} rounded-xl p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <GroupIcon className="w-4 h-4 text-secondary" />
                  <h3 className={`text-sm font-semibold ${themeStyles.text}`}>{g.system}</h3>
                </div>
                <p className={`text-xs ${themeStyles.textMuted} mb-3`}>{g.subtitle}</p>
                <div className="flex flex-col gap-2">
                  {g.docs.map((d) => {
                    const active = activeSlug === d.slug;
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.slug}
                        onClick={() => setActiveSlug(d.slug)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border text-left ${
                          active
                            ? "bg-secondary text-secondary-foreground border-secondary"
                            : `${themeStyles.textMuted} ${themeStyles.border} hover:border-secondary`
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {data?.updated_at && (
          <p className={`text-xs ${themeStyles.textMuted} mb-3`}>
            Última atualização:{" "}
            <span className={themeStyles.text}>
              {format(new Date(data.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
          </div>
        ) : (
          <RichEditor
            value={html}
            onChange={setHtml}
            placeholder="Escreva o conteúdo do documento..."
          />
        )}

        <div className={`mt-4 border ${themeStyles.border} rounded-xl p-3 space-y-2`}>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={500}
            placeholder="Resumo da alteração (opcional)"
            className={`w-full h-10 px-3 rounded-lg border ${themeStyles.border} bg-transparent text-sm ${themeStyles.text}`}
          />
          <label className={`flex items-center gap-2 text-sm ${themeStyles.text}`}>
            <input type="checkbox" checked={requiresReaccept} onChange={(e) => setRequiresReaccept(e.target.checked)} />
            Exigir novo aceite dos usuários nesta versão
          </label>
          <p className={`text-xs ${themeStyles.textMuted}`}>
            Cada publicação cria uma nova versão imutável com hash SHA-256; versões e aceites anteriores são preservados.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={update.isPending || isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {update.isPending ? "Publicando..." : "Publicar nova versão"}
          </button>
        </div>
      </div>

      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4 md:p-6`}>
        <h3 className={`font-display text-lg ${themeStyles.text} mb-3`}>Histórico de versões</h3>
        <div className="space-y-2">
          {(versions ?? []).map((v) => (
            <div key={v.id} className={`border ${themeStyles.border} rounded-lg p-3 text-sm`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`font-semibold ${themeStyles.text}`}>
                  Versão {v.version}{v.requires_reacceptance ? " · exige aceite" : ""}
                </span>
                <span className={themeStyles.textMuted}>
                  {format(new Date(v.published_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </span>
              </div>
              {v.change_summary && <p className={`${themeStyles.textMuted} mt-1`}>{v.change_summary}</p>}
              <p className={`font-mono text-xs break-all mt-1 ${themeStyles.textMuted}`}>SHA-256: {v.content_sha256}</p>
              <button onClick={() => setViewing(viewing === v.id ? null : v.id)} className="text-xs underline mt-1 text-secondary">
                {viewing === v.id ? "Ocultar conteúdo" : "Ver conteúdo integral"}
              </button>
              {viewing === v.id && (
                <pre className={`mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs ${themeStyles.text}`}>{v.content_html}</pre>
              )}
            </div>
          ))}
          {versions && versions.length === 0 && <p className={themeStyles.textMuted}>Nenhuma versão registrada.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminLegalManager;