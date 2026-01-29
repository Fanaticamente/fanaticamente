import { useState } from "react";
import { useFootballNews } from "@/hooks/useFootballNews";
import NewsCard from "./NewsCard";
import FeaturedNewsCarousel from "./FeaturedNewsCarousel";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NewsListProps {
  selectedCategory: string;
}

const NewsList = ({ selectedCategory }: NewsListProps) => {
  const { data: news, isLoading, error, refetch, isFetching, forceScrape } = useFootballNews();
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    if (isForceRefreshing) return;
    
    setIsForceRefreshing(true);
    
    try {
      const result = await forceScrape();
      // Only show toast if new news was found
      if (result?.processed > 0) {
        toast.success(`${result.processed} nova(s) notícia(s) encontrada(s)!`);
      }
      // Silent if no new news or error - no notification needed
    } catch (err) {
      // Silent error - don't show notification to user
      console.error("[NewsList] Force refresh error:", err);
    } finally {
      setIsForceRefreshing(false);
    }
  };

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
          onClick={handleForceRefresh} 
          className="mt-4"
          disabled={isForceRefreshing}
        >
          {isForceRefreshing ? (
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

  // First 3 articles go to the carousel (featured)
  const featuredNews = filteredNews.slice(0, 3);
  // Rest goes to the list
  const otherNews = filteredNews.slice(3);

  return (
    <div className="space-y-6">
      {/* Featured News Carousel - always shows the 3 most recent */}
      {featuredNews.length > 0 && (
        <div className="px-4">
          <FeaturedNewsCarousel news={featuredNews} />
        </div>
      )}

      {/* News List - older articles */}
      {otherNews.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-black">
              Últimas Notícias
            </h3>
            <div className="flex items-center gap-2">
              {(isFetching || isForceRefreshing) && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceRefresh}
                disabled={isForceRefreshing}
                className="text-primary hover:text-primary/80 hover:bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isForceRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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
