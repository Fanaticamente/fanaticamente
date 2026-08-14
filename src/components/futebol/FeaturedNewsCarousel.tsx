import { useState } from "react";
import { Clock, ChevronLeft, ChevronRight, Newspaper, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { FootballNewsItem } from "@/hooks/useFootballNews";
import type { HealthNewsItem } from "@/hooks/useHealthNews";
import NewsCard from "./NewsCard";
import { cleanNewsContent, toParagraphs } from "@/lib/newsContent";
import { fixTitleCapitalization } from "@/lib/fixTitleCapitalization";
import HealthNewsReader from "@/components/setor-saude/HealthNewsReader";

export type CarouselItemData =
  | { kind: "football"; date: number; data: FootballNewsItem }
  | { kind: "health"; date: number; data: HealthNewsItem };

interface FeaturedNewsCarouselProps {
  items: CarouselItemData[];
  accentColor?: string | null;
}

const FeaturedNewsCarousel = ({ items, accentColor }: FeaturedNewsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNews, setSelectedNews] = useState<FootballNewsItem | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<HealthNewsItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
          setApi={(api) => {
            api?.on("select", () => {
              setCurrentIndex(api.selectedScrollSnap());
            });
          }}
        >
          <CarouselContent>
            {items.map((item) =>
              item.kind === "football" ? (
                <CarouselItem key={`f-${item.data.id}`}>
                  <FeaturedSlide
                    news={item.data}
                    onOpen={() => setSelectedNews(item.data)}
                    accentColor={accentColor}
                  />
                </CarouselItem>
              ) : (
                <CarouselItem key={`h-${item.data.id}`}>
                  <FeaturedHealthSlide
                    news={item.data}
                    onOpen={() => setSelectedHealth(item.data)}
                  />
                </CarouselItem>
              )
            )}
          </CarouselContent>
        </Carousel>

        {/* Pagination dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {items.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
                style={index === currentIndex ? { backgroundColor: accentColor || 'hsl(var(--primary))' } : undefined}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer for selected news */}
      {selectedNews && (
        <NewsCardDrawerWrapper 
          news={selectedNews} 
          onClose={() => setSelectedNews(null)} 
        />
      )}

      {selectedHealth && (
        <HealthNewsReader
          news={selectedHealth}
          isOpen={true}
          onClose={() => setSelectedHealth(null)}
        />
      )}
    </>
  );
};

interface FeaturedHealthSlideProps {
  news: HealthNewsItem;
  onOpen: () => void;
}

const FeaturedHealthSlide = ({ news, onOpen }: FeaturedHealthSlideProps) => {
  const date = news.published_at ? new Date(news.published_at) : new Date(news.created_at);
  const timeAgo = formatDistanceToNow(date, {
    addSuffix: true,
    locale: ptBR,
  })
    .replace(/^há cerca de /, "há ")
    .replace(/^cerca de /, "");

  const preview = news.excerpt || news.subtitle || "";

  return (
    <button onClick={onOpen} className="block w-full text-left">
      <div className="bg-white rounded-2xl overflow-hidden relative group shadow-sm">
        {news.cover_image_url && (
          <div className="relative h-52 overflow-hidden">
            <img
              src={news.cover_image_url}
              alt={news.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase flex items-center gap-1">
              <Heart className="w-3 h-3" /> Setor Saúde
            </span>
          </div>
        )}
        <div className="p-4">
          <h2 className="font-sans font-bold text-lg leading-tight text-gray-900 mb-2 line-clamp-2">
            {news.title}
          </h2>
          {preview && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{preview}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-500 text-xs">
              <span className="font-medium text-emerald-700">Fanaticamente</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>
            <span className="text-sm font-medium flex items-center gap-1 text-emerald-700">
              <Newspaper className="w-4 h-4" />
              Ler mais
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface FeaturedSlideProps {
  news: FootballNewsItem;
  onOpen: () => void;
  accentColor?: string | null;
}



const FeaturedSlide = ({ news, onOpen, accentColor }: FeaturedSlideProps) => {
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  }).replace(/^há cerca de /, "há ").replace(/^cerca de /, "");

  const fixedTitle = fixTitleCapitalization(news.rewritten_title);
  const cleanedContent = cleanNewsContent(news.rewritten_content);
  const contentPreview = cleanedContent.slice(0, 120) + (cleanedContent.length > 120 ? "..." : "");

  return (
    <button
      onClick={onOpen}
      className="block w-full text-left"
    >
      <div className="bg-white rounded-2xl overflow-hidden relative group shadow-sm">
        {news.image_url && (
          <div className="relative h-52 overflow-hidden">
            <img
              src={news.image_url}
               alt={fixedTitle}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Badge on image */}
            <span 
              className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-bold rounded-full uppercase"
              style={{ backgroundColor: accentColor || 'hsl(var(--primary))' }}
            >
              Destaque
            </span>
          </div>
        )}
        <div className="p-4">
           <h2 className="font-sans font-bold text-lg leading-tight text-gray-900 mb-2 transition-colors line-clamp-2">
            {fixedTitle}
          </h2>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {contentPreview}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-500 text-xs">
              <span className="font-medium" style={{ color: accentColor || 'hsl(var(--primary))' }}>Fanaticamente</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: accentColor || 'hsl(var(--primary))' }}>
              <Newspaper className="w-4 h-4" />
              Ler mais
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

// Wrapper to use the NewsCard drawer functionality
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NewsCardDrawerWrapperProps {
  news: FootballNewsItem;
  onClose: () => void;
}

const NewsCardDrawerWrapper = ({ news, onClose }: NewsCardDrawerWrapperProps) => {
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const fixedTitle = fixTitleCapitalization(news.rewritten_title);
  
  const cleanedContent = cleanNewsContent(news.rewritten_content);
  
  const publishDate = new Date(news.published_at);
  const formattedDate = publishDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fontSizeClasses = [
    'text-[15px] leading-[1.8]',
    'text-[18px] leading-[1.85]',
    'text-[21px] leading-[1.9]',
  ];

  const toggleFontSize = () => {
    setFontSizeLevel((prev) => (prev + 1) % 3);
  };

  const cleanCredits = (credits: string | null) => {
    if (!credits) return null;
    return credits.replace(/^\d+ de \d+\s*/i, '').trim();
  };

  const cleanedCredits = cleanCredits(news.image_credits);

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-white">
        <DrawerHeader className="border-b border-gray-300 pb-4 bg-white px-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center justify-between mb-3 pt-1">
                <span 
                  className="text-xs tracking-[0.3em] uppercase text-gray-600"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {news.category} • Fanaticamente
                </span>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-xs text-gray-500 capitalize"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {formattedDate}
                  </span>
                  <button 
                    onClick={toggleFontSize}
                    className={`flex items-baseline px-2.5 py-1.5 rounded-md transition-colors ${
                      fontSizeLevel > 0 
                        ? 'bg-gray-200 text-gray-900' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Alterar tamanho da fonte"
                  >
                    <span className="text-[11px] font-bold">A</span>
                    <span className="text-[15px] font-bold">A</span>
                  </button>
                </div>
              </div>
              
              <DrawerTitle className="text-2xl sm:text-3xl font-sans font-bold text-black leading-tight tracking-tight text-left">
                {fixedTitle}
              </DrawerTitle>
            </div>
            
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 text-gray-600 hover:text-black hover:bg-transparent -mt-1">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto bg-white max-h-[calc(92vh-100px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="px-5 py-6 space-y-5 pb-20">
            {news.image_url && (
              <figure className="border border-gray-300">
                <img
                  src={news.image_url}
                  alt={fixedTitle}
                  className="w-full h-auto object-cover grayscale-[20%] contrast-[1.05]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {cleanedCredits && (
                  <figcaption className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-t border-gray-300 font-sans line-clamp-2">
                    {cleanedCredits}
                  </figcaption>
                )}
              </figure>
            )}

            <article 
              className={`text-gray-900 text-justify hyphens-auto transition-all duration-200 ${fontSizeClasses[fontSizeLevel]}`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {toParagraphs(cleanedContent).map((paragraph, idx) => (
                <p
                  key={idx}
                  className={`whitespace-pre-line ${idx > 0 ? "mt-4" : "first-letter:float-left first-letter:text-[3.5rem] first-letter:font-bold first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-black"}`}
                >
                  {paragraph}
                </p>
              ))}
            </article>

            <div className="pt-4 border-t border-gray-300">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-px bg-gray-400"></div>
                <span className="text-gray-400 text-sm">◆ ◆ ◆</span>
                <div className="w-8 h-px bg-gray-400"></div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3 tracking-wide font-sans">
                por <span className="font-semibold text-gray-700">Fanaticamente</span>
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FeaturedNewsCarousel;
