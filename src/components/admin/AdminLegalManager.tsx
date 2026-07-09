import { useEffect, useState } from "react";
import { Save, FileText, Scale, Users, Stethoscope } from "lucide-react";
import RichEditor from "@/components/marketing/RichEditor";
import { useLegalDocument, useUpdateLegalDocument, type LegalSlug } from "@/hooks/useLegalDocument";
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

const DOCS: { slug: LegalSlug; label: string; icon: typeof FileText }[] = [
  { slug: "privacy-policy", label: "Política de Privacidade — Torcedor", icon: Users },
  { slug: "privacy-policy-professional", label: "Política de Privacidade — Profissional", icon: Stethoscope },
  { slug: "terms-of-use", label: "Termos de Uso", icon: FileText },
];

const AdminLegalManager = ({ themeStyles }: Props) => {
  const [activeSlug, setActiveSlug] = useState<LegalSlug>("privacy-policy");
  const { data, isLoading } = useLegalDocument(activeSlug);
  const update = useUpdateLegalDocument();
  const [html, setHtml] = useState("");

  useEffect(() => {
    const stored = data?.content_html ?? "";
    setHtml(isEmptyHtml(stored) ? DEFAULTS[activeSlug] : stored);
  }, [activeSlug, data?.content_html]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({ slug: activeSlug, content_html: html });
      toast.success("Documento atualizado com sucesso!");
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

        <div className="flex flex-wrap gap-2 mb-4">
          {DOCS.map((d) => {
            const active = activeSlug === d.slug;
            const Icon = d.icon;
            return (
              <button
                key={d.slug}
                onClick={() => setActiveSlug(d.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  active
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : `${themeStyles.textMuted} ${themeStyles.border} hover:border-secondary`
                }`}
              >
                <Icon className="w-4 h-4" />
                {d.label}
              </button>
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

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={update.isPending || isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {update.isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLegalManager;