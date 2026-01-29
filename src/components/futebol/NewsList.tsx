import { useFootballNews } from "@/hooks/useFootballNews";
import NewsCard from "./NewsCard";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsListProps {
  selectedCategory: string;
}

const NewsList = ({ selectedCategory }: NewsListProps) => {
  const { data: news, isLoading, error, refetch, isFetching } = useFootballNews();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-gray-500 text-sm">Carregando notícias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Erro ao carregar notícias</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">Nenhuma notícia encontrada</p>
        <p className="text-sm text-gray-400">
          As notícias são atualizadas automaticamente a cada 2 minutos
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4"
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Buscar notícias agora
        </Button>
      </div>
    );
  }

  // Filter by category if not "Todos"
  const filteredNews =
    selectedCategory === "Todos"
      ? news
      : news.filter((item) => item.category === selectedCategory);

  const featuredNews = filteredNews[0];
  const otherNews = filteredNews.slice(1);

  return (
    <div className="space-y-6">
      {/* Featured News */}
      {featuredNews && (
        <div className="px-4">
          <NewsCard news={featuredNews} isFeatured />
        </div>
      )}

      {/* News List */}
      {otherNews.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-black">
              Últimas Notícias
            </h3>
            {isFetching && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          <div className="space-y-3">
            {otherNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </div>
      )}

      {/* Auto-update indicator */}
      <div className="px-4 py-2 text-center">
        <p className="text-xs text-gray-500">
          ⚡ Atualização automática a cada 2 minutos
        </p>
      </div>
    </div>
  );
};

export default NewsList;
