import { useState } from "react";
import { Clock, ChevronRight, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FootballNewsItem } from "@/hooks/useFootballNews";

interface NewsCardProps {
  news: FootballNewsItem;
  isFeatured?: boolean;
}

const NewsCard = ({ news, isFeatured = false }: NewsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  });

  // Get a short preview of the content (first 150 chars)
  const contentPreview = news.rewritten_content.slice(0, 150) + (news.rewritten_content.length > 150 ? "..." : "");

  if (isFeatured) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="block w-full text-left"
        >
          <div className="bg-white rounded-2xl overflow-hidden relative group shadow-sm">
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
              <h2 className="font-sans font-bold text-2xl text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {news.rewritten_title}
              </h2>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {contentPreview}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <span className="font-medium text-primary">Fanaticamente</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </span>
                </div>
                <span className="text-primary text-sm font-medium group-hover:underline">
                  Ler mais →
                </span>
              </div>
            </div>
          </div>
        </button>

        <NewsDrawer news={news} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors group shadow-sm"
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
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            ⚽
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-sans font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {news.rewritten_title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded">{news.category}</span>
            <span className="font-medium text-primary">Fanaticamente</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
      </button>

      <NewsDrawer news={news} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

interface NewsDrawerProps {
  news: FootballNewsItem;
  isOpen: boolean;
  onClose: () => void;
}

const NewsDrawer = ({ news, isOpen, onClose }: NewsDrawerProps) => {
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                  {news.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo}
                </span>
              </div>
              <DrawerTitle className="text-xl font-sans font-bold text-left leading-tight">
                {news.rewritten_title}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-120px)]">
          <div className="p-4 space-y-4">
            {/* Image */}
            {news.image_url && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={news.image_url}
                  alt={news.image_caption || news.rewritten_title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {(news.image_caption || news.image_credits) && (
                  <div className="bg-muted p-2 text-xs text-muted-foreground">
                    {news.image_caption && <p>{news.image_caption}</p>}
                    {news.image_credits && (
                      <p className="italic">{news.image_credits}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {news.rewritten_content}
              </p>
            </div>

            {/* Source attribution */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Conteúdo produzido por <span className="font-bold text-primary">Fanaticamente</span>
              </p>
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default NewsCard;
