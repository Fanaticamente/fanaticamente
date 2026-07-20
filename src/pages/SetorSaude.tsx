import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2 } from "lucide-react";
import { useHealthNews, useHealthNewsItem } from "@/hooks/useHealthNews";
import HealthNewsCard from "@/components/setor-saude/HealthNewsCard";
import HealthNewsReader from "@/components/setor-saude/HealthNewsReader";
import { SetorSaudeInlineIcon } from "@/components/icons/SetorSaudeInlineIcon";

const SetorSaude = () => {
  const { data: news, isLoading } = useHealthNews(50);
  const [params, setParams] = useSearchParams();
  const articleId = params.get("artigo");
  const { data: directArticle } = useHealthNewsItem(articleId || undefined);
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    if (articleId && directArticle) setReaderOpen(true);
  }, [articleId, directArticle]);

  const closeReader = () => {
    setReaderOpen(false);
    if (articleId) {
      params.delete("artigo");
      setParams(params, { replace: true });
    }
  };

  const featured = news?.slice(0, 1) || [];
  const rest = news?.slice(1) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header title="Setor Saúde" />

      <main className="pt-20">
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[var(--club-700)]">
            <div className="flex items-center gap-2">
              <SetorSaudeInlineIcon
                variant="green"
                className="h-14 w-14 shrink-0 object-contain"
                aria-hidden
                focusable="false"
              />
              <h1 className="text-4xl font-display font-bold tracking-tight text-[var(--club-700)]">
                Setor Saúde
              </h1>
            </div>
          </div>
          <p className="text-gray-600 text-sm tracking-wide font-sans">
            Saúde mental, bem-estar e vida equilibrada para todo torcedor
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--club-700)]" />
            <p className="text-gray-500 text-sm">Carregando conteúdo...</p>
          </div>
        )}

        {!isLoading && (!news || news.length === 0) && (
          <div className="text-center py-16 px-4">
            <SetorSaudeInlineIcon
              variant="green"
              className="w-14 h-14 mx-auto mb-3 object-contain opacity-30"
              aria-hidden
              focusable="false"
            />
            <p className="text-gray-500 text-base font-medium">Em breve, novos conteúdos por aqui</p>
            <p className="text-sm text-gray-400 mt-1">
              Nossa equipe está preparando matérias incríveis sobre saúde e bem-estar
            </p>
          </div>
        )}

        {featured.length > 0 && (
          <div className="px-4 mb-4">
            <HealthNewsCard news={featured[0]} variant="featured" />
          </div>
        )}

        {rest.length > 0 && (
          <div className="px-4 space-y-3">
            <h3 className="font-display text-xl text-gray-800 mt-4 mb-3">Mais matérias</h3>
            {rest.map((item) => (
              <HealthNewsCard key={item.id} news={item} />
            ))}
          </div>
        )}

        <div aria-hidden className="h-28" />
      </main>

      {directArticle && (
        <HealthNewsReader news={directArticle} isOpen={readerOpen} onClose={closeReader} />
      )}

      <BottomNav />
    </div>
  );
};

export default SetorSaude;