import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2 } from "lucide-react";
import { useHealthNews, useHealthNewsItem } from "@/hooks/useHealthNews";
import HealthNewsCard from "@/components/setor-saude/HealthNewsCard";
import HealthNewsReader from "@/components/setor-saude/HealthNewsReader";
import setorSaudeIcon from "@/assets/setor-saude-icon.png";

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
      <Header />

      <main className="pt-20">
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-emerald-700">
            <div className="flex items-center gap-2">
              <img
                src={setorSaudeIcon}
                alt="Setor Saúde"
                className="h-14 w-auto object-contain"
              />
              <h1 className="text-4xl font-display font-bold tracking-tight text-emerald-700">
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
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
            <p className="text-gray-500 text-sm">Carregando conteúdo...</p>
          </div>
        )}

        {!isLoading && (!news || news.length === 0) && (
          <div className="text-center py-16 px-4">
            <img
              src={setorSaudeIcon}
              alt=""
              className="w-14 h-14 mx-auto mb-3 opacity-30"
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