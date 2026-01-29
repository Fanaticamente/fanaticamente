import { Clock, ChevronRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FootballNewsItem } from "@/hooks/useFootballNews";

interface NewsCardProps {
  news: FootballNewsItem;
  isFeatured?: boolean;
}

const NewsCard = ({ news, isFeatured = false }: NewsCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  });

  if (isFeatured) {
    return (
      <a
        href={news.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="bg-secondary rounded-2xl overflow-hidden relative group">
          {news.image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={news.image_url}
                alt={news.image_caption || news.rewritten_title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {news.image_credits && (
                <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                  {news.image_credits}
                </span>
              )}
            </div>
          )}
          <div className="p-6">
            <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase mb-3">
              Destaque
            </span>
            <h2 className="font-display text-2xl text-secondary-foreground mb-2 group-hover:text-primary transition-colors">
              {news.rewritten_title}
            </h2>
            <p className="text-secondary-foreground/70 text-sm line-clamp-2 mb-3">
              {news.rewritten_content}
            </p>
            <div className="flex items-center gap-3 text-secondary-foreground/70 text-sm">
              <span className="font-medium text-primary">Fanaticamente</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={news.original_url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full text-left bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors group block"
    >
      {news.image_url ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={news.image_url}
            alt={news.image_caption || news.rewritten_title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full bg-muted flex items-center justify-center text-2xl">⚽</div>`;
              }
            }}
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
          ⚽
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-card-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {news.rewritten_title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 bg-muted rounded">{news.category}</span>
          <span className="font-medium text-primary">Fanaticamente</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
    </a>
  );
};

export default NewsCard;
