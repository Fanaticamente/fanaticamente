import { useState } from "react";
import { Clock, ChevronRight, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HealthNewsItem } from "@/hooks/useHealthNews";
import HealthNewsReader from "./HealthNewsReader";

interface HealthNewsCardProps {
  news: HealthNewsItem;
  variant?: "list" | "featured";
  defaultOpen?: boolean;
  onClose?: () => void;
}

const HealthNewsCard = ({ news, variant = "list", defaultOpen = false, onClose }: HealthNewsCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const date = news.published_at ? new Date(news.published_at) : new Date(news.created_at);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    .replace(/^cerca de /, "")
    .replace(/^há cerca de /, "há ");

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (variant === "featured") {
    return (
      <>
        <button onClick={() => setIsOpen(true)} className="block w-full text-left">
          <div className="bg-white rounded-2xl overflow-hidden relative group shadow-sm">
            {news.cover_image_url && (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={news.cover_image_url}
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Setor Saúde
                </span>
              </div>
            )}
            <div className="p-4">
              <h2 className="font-sans font-bold text-xl leading-tight text-gray-900 mb-2 line-clamp-2">
                {news.title}
              </h2>
              {news.excerpt && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{news.excerpt}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-emerald-700">Fanaticamente</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo}
                </span>
              </div>
            </div>
          </div>
        </button>
        <HealthNewsReader news={news} isOpen={isOpen} onClose={close} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 transition-colors group shadow-sm hover:border-emerald-300"
      >
        {news.cover_image_url ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <img src={news.cover_image_url} alt={news.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Heart className="w-7 h-7 text-emerald-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-sans font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
            {news.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap overflow-hidden">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded truncate">{news.category}</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {timeAgo}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
      </button>
      <HealthNewsReader news={news} isOpen={isOpen} onClose={close} />
    </>
  );
};

export default HealthNewsCard;