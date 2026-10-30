import { ChevronLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLegalPublicVersion, sha256Utf8Hex, type LegalSlug } from "@/hooks/useLegalDocument";

interface Props {
  slug: LegalSlug;
  title: string;
  /** Fallback rendered when the DB document has no content yet. */
  fallback?: React.ReactNode;
  /** Fallback date shown when the DB document has no update timestamp. */
  fallbackDate?: string;
}

const LegalDocumentView = ({ slug, title, fallback, fallbackDate }: Props) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const versionId = params.get("v");
  // Source of truth: immutable version table (same row the acceptance is recorded against).
  const { data, isLoading } = useLegalPublicVersion(slug, versionId);
  const [hashOk, setHashOk] = useState<boolean | null>(null);
  useEffect(() => {
    setHashOk(null);
    if (!data?.content_html) return;
    sha256Utf8Hex(data.content_html).then((h) => setHashOk(h === data.content_sha256));
  }, [data?.content_html, data?.content_sha256]);

  const hasContent = !!data?.content_html && data.content_html.replace(/<[^>]+>/g, "").trim().length > 0;
  const safeHtml = hasContent ? DOMPurify.sanitize(data!.content_html) : "";

  const updatedLabel = data?.published_at
    ? format(new Date(data.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : fallbackDate;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white px-4 py-4 flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-100 text-black hover:bg-gray-200 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-black font-bold text-lg">{title}</h1>
      </header>

      <main className="px-4 py-5 sm:p-6 pb-28 max-w-4xl mx-auto w-full overflow-x-hidden overflow-y-auto h-[calc(100dvh-64px)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full" />
          </div>
        ) : hasContent ? (
          <article
            className="prose prose-sm sm:prose max-w-none text-black break-words overflow-x-hidden"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          fallback ?? (
            <p className="text-gray-600">Este documento ainda não foi publicado.</p>
          )
        )}

        {updatedLabel && (
          <p className="text-center text-gray-500 text-sm mt-12 pt-6 border-t border-gray-200">
            Última atualização: {updatedLabel}
          </p>
        )}
        {data && (
          <p className="text-center text-gray-500 text-xs mt-3 break-all" data-legal-version={data.id}>
            Versão {data.version} · SHA-256 {data.content_sha256}
            {hashOk === true && " · integridade conferida"}
            {hashOk === false && " · atenção: conteúdo não confere com o hash"}
          </p>
        )}
      </main>
    </div>
  );
};

export default LegalDocumentView;