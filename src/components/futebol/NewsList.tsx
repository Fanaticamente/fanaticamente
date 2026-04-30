import { useState } from "react";
import { useFootballNews } from "@/hooks/useFootballNews";
import { useHealthNews } from "@/hooks/useHealthNews";
import HealthNewsCard from "@/components/setor-saude/HealthNewsCard";
import { SetorSaudeInlineIcon } from "@/components/icons/SetorSaudeInlineIcon";
import NewsCard from "./NewsCard";
import FeaturedNewsCarousel from "./FeaturedNewsCarousel";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { brazilianClubs } from "@/data/brazilianClubs";

interface NewsListProps {
  selectedCategory: string;
  selectedClub?: string | null;
  accentColor?: string | null;
}

const NewsList = ({ selectedCategory, selectedClub, accentColor }: NewsListProps) => {
  const { data: news, isLoading, error, refetch, isFetching, forceScrape } = useFootballNews(selectedClub);
  const { data: healthNews } = useHealthNews(20);
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

  // Get club data for filtering
  const selectedClubData = selectedClub 
    ? brazilianClubs.find((c) => c.id === selectedClub) 
    : null;

  // Filter by category if not "Todos" (club filtering is done at DB level)
  let filteredNews =
    selectedCategory === "Todos"
      ? news
      : news.filter((item) => item.category === selectedCategory);

  // First 3 articles go to the carousel (featured)
  const featuredNews = filteredNews.slice(0, 3);
  // Rest goes to the list
  const otherNews = filteredNews.slice(3);

  // Health news always appear in football feed (general & per-club),
  // unless a specific category filter (other than "Todos"/"Futebol") is active.
  const shouldShowHealth = selectedCategory === "Todos" || selectedCategory === "Futebol";
  const healthItems = shouldShowHealth ? (healthNews || []) : [];

  // Show empty state if club filter returns no results
  if (filteredNews.length === 0 && selectedClub) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <img 
            src={selectedClubData?.badgeUrl} 
            alt={selectedClubData?.name} 
            className="w-10 h-10 object-contain"
          />
        </div>
        <p className="text-gray-500 mb-2">
          Nenhuma notícia sobre o {selectedClubData?.name}
        </p>
        <p className="text-sm text-gray-400">
          Tente novamente mais tarde ou selecione outro clube
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured News Carousel - always shows the 3 most recent */}
      {featuredNews.length > 0 && (
        <div className="px-4">
          <FeaturedNewsCarousel news={featuredNews} accentColor={accentColor} />
        </div>
      )}

      {/* Setor Saúde — apareceu novas matérias */}
      {healthItems.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xl text-emerald-700 flex items-center gap-2">
              <SetorSaudeInlineIcon className="w-6 h-6" />
              Setor Saúde
            </h3>
          </div>
          <div className="space-y-3">
            {healthItems.slice(0, 3).map((item) => (
              <HealthNewsCard key={item.id} news={item} />
            ))}
          </div>
        </div>
      )}

      {/* News List - older articles */}
      {otherNews.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-gray-800">
              {selectedClubData ? `Notícias do ${selectedClubData.name}` : "Últimas Notícias"}
            </h3>
            <div className="flex items-center gap-2">
              {(isFetching || isForceRefreshing) && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor || undefined }} />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceRefresh}
                disabled={isForceRefreshing}
                className="hover:bg-transparent"
                style={{ color: accentColor || undefined }}
              >
                <RefreshCw className={`w-4 h-4 ${isForceRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {otherNews.map((item) => (
              <NewsCard key={item.id} news={item} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default NewsList;
