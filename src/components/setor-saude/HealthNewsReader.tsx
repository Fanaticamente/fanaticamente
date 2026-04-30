import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
import type { HealthNewsItem } from "@/hooks/useHealthNews";
import DOMPurify from "dompurify";

interface HealthNewsReaderProps {
  news: HealthNewsItem;
  isOpen: boolean;
  onClose: () => void;
}

const HealthNewsReader = ({ news, isOpen, onClose }: HealthNewsReaderProps) => {
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  const fontSizeClasses = [
    "prose-base",
    "prose-lg",
    "prose-xl",
  ];

  const date = news.published_at ? new Date(news.published_at) : new Date(news.created_at);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sanitizedHtml = DOMPurify.sanitize(news.content || "", {
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-white">
        <DrawerHeader className="border-b border-gray-300 pb-4 bg-white px-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center justify-between mb-3 pt-1">
                <span
                  className="text-xs tracking-[0.3em] uppercase text-emerald-700 font-semibold whitespace-nowrap truncate"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {news.category}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs text-gray-500 capitalize hidden sm:inline"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {formattedDate}
                  </span>
                  <button
                    onClick={() => setFontSizeLevel((p) => (p + 1) % 3)}
                    className={`flex items-baseline px-2.5 py-1.5 rounded-md transition-colors ${
                      fontSizeLevel > 0
                        ? "bg-gray-200 text-gray-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Alterar tamanho da fonte"
                  >
                    <span className="text-[11px] font-bold">A</span>
                    <span className="text-[15px] font-bold">A</span>
                  </button>
                </div>
              </div>

              <DrawerTitle className="text-2xl sm:text-3xl font-sans font-bold text-black leading-tight tracking-tight text-left">
                {news.title}
              </DrawerTitle>
              {news.subtitle && (
                <p className="mt-2 text-base text-gray-600 leading-snug">{news.subtitle}</p>
              )}
            </div>

            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-gray-600 hover:text-black hover:bg-transparent -mt-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto bg-white max-h-[calc(92vh-100px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="px-5 py-6 space-y-5 pb-20">
            {news.cover_image_url && (
              <figure className="border border-gray-300">
                <img
                  src={news.cover_image_url}
                  alt={news.image_caption || news.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {(news.image_caption || news.image_credits) && (
                  <figcaption className="bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-300 font-sans">
                    {news.image_caption}
                    {news.image_credits && (
                      <span className="text-gray-500"> — {news.image_credits}</span>
                    )}
                  </figcaption>
                )}
              </figure>
            )}

            <article
              className={`prose ${fontSizeClasses[fontSizeLevel]} max-w-none text-gray-900 prose-headings:text-gray-900 prose-a:text-emerald-700 prose-strong:text-gray-900 prose-img:rounded-lg`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />

            <div className="pt-4 border-t border-gray-300">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-px bg-gray-400"></div>
                <span className="text-gray-400 text-sm">◆ ◆ ◆</span>
                <div className="w-8 h-px bg-gray-400"></div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3 tracking-wide font-sans">
                por <span className="font-semibold text-gray-700">Fanaticamente</span>
                {" • "}
                {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
                  .replace(/^há cerca de /, "há ")
                  .replace(/^cerca de /, "")}
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HealthNewsReader;