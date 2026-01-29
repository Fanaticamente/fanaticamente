import { useState, useEffect, useRef } from "react";
import { Clock, ChevronRight, X, Newspaper, Volume2, Pause, Play, Loader2 } from "lucide-react";
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

// Clean caption to show only subject name, removing action descriptions
const cleanImageCaption = (caption: string | null): string | null => {
  if (!caption) return null;
  
  // Remove video metadata patterns
  if (caption.includes('|')) return null;
  
  // Remove slide indicators
  if (caption.match(/^\d+ de \d+/)) return null;
  
  // Remove interaction instructions
  if (caption.toLowerCase().includes('arraste')) return null;
  
  // Remove action descriptions - these patterns describe what the person is DOING
  // We only want the person's NAME
  const actionPatterns = [
    / vive .*/i,
    / está .*/i,
    / faz .*/i,
    / durante .*/i,
    / em partida .*/i,
    / em treino .*/i,
    / em entrevista .*/i,
    / no jogo .*/i,
    / na partida .*/i,
    / após .*/i,
    / antes .*/i,
    / comemora .*/i,
    / celebra .*/i,
    / disputa .*/i,
    / treina .*/i,
    / participa .*/i,
    / para o ge.*/i,
    / momento .*/i,
    / concede .*/i,
    / fala .*/i,
    / conversa .*/i,
  ];
  
  let cleanedCaption = caption;
  for (const pattern of actionPatterns) {
    cleanedCaption = cleanedCaption.replace(pattern, '');
  }
  cleanedCaption = cleanedCaption.trim();
  
  // If it's too short after cleaning, it's probably just a team name
  if (cleanedCaption.length < 5) return null;
  
  return cleanedCaption;
};

const NewsCard = ({ news, isFeatured = false }: NewsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  });

  // Get a short preview of the content (first 150 chars)
  const contentPreview = news.rewritten_content.slice(0, 150) + (news.rewritten_content.length > 150 ? "..." : "");

  // Clean the caption for display
  const displayCaption = cleanImageCaption(news.image_caption);

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
                  alt={displayCaption || news.rewritten_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase mb-2">
                Destaque
              </span>
              <h2 className="font-sans font-bold text-xl leading-tight text-gray-900 mb-2 group-hover:text-primary transition-colors">
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
                <span className="text-primary text-sm font-medium flex items-center gap-1">
                  <Newspaper className="w-4 h-4" />
                  Ler mais
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
              alt={displayCaption || news.rewritten_title}
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
          <h4 className="font-sans font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
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
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // 0 = normal, 1 = medium, 2 = large
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  });

  // Get date formatted like newspaper
  const publishDate = new Date(news.published_at);
  const formattedDate = publishDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Font size classes based on level
  const fontSizeClasses = [
    'text-[15px] leading-[1.8]', // Normal
    'text-[18px] leading-[1.85]', // Medium
    'text-[21px] leading-[1.9]', // Large
  ];

  // Toggle through font sizes
  const toggleFontSize = () => {
    setFontSizeLevel((prev) => (prev + 1) % 3);
  };

  // ElevenLabs TTS - High quality Brazilian Portuguese voice
  const startSpeaking = async () => {
    if (isLoading) return;
    
    // If already have audio cached, just play it
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const textToRead = `${news.rewritten_title}. ${news.rewritten_content}`;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: textToRead }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("ElevenLabs error:", errorData);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      await audio.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSpeaking = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const toggleSpeech = () => {
    if (isPlaying) {
      if (isPaused) {
        resumeSpeaking();
      } else {
        pauseSpeaking();
      }
    } else {
      startSpeaking();
    }
  };

  // Cleanup audio when drawer closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    }
  }, [isOpen]);

  // Clean image credits - remove "1 de 2" patterns
  const cleanCredits = (credits: string | null) => {
    if (!credits) return null;
    // Remove "1 de 2 " prefix patterns
    return credits.replace(/^\d+ de \d+\s*/i, '').trim();
  };

  const cleanedCredits = cleanCredits(news.image_credits);
  const displayCaption = cleanImageCaption(news.image_caption);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-[#FDF8F0]">
        <DrawerHeader className="border-b border-gray-300 pb-4 bg-[#FDF8F0] px-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              {/* Newspaper masthead style */}
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
                  {/* Font size toggle button - AA icon */}
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
              
              {/* Newspaper headline with audio button */}
              <div className="flex items-start gap-3">
                {/* Audio/TTS button */}
                <button 
                  onClick={toggleSpeech}
                  disabled={isLoading}
                  className={`flex-shrink-0 mt-1 p-2 rounded-full transition-colors ${
                    isLoading 
                      ? 'bg-gray-200 text-gray-400 cursor-wait'
                      : isPlaying 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isLoading ? "Carregando áudio..." : isPlaying ? (isPaused ? "Continuar leitura" : "Pausar leitura") : "Ouvir matéria"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <DrawerTitle className="text-2xl sm:text-3xl font-sans font-bold text-black leading-tight tracking-tight text-left">
                  {news.rewritten_title}
                </DrawerTitle>
              </div>
            </div>
            
            {/* Close button */}
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 text-gray-600 hover:text-black hover:bg-transparent -mt-1">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Scrollable content with hidden scrollbar */}
        <div className="flex-1 overflow-y-auto bg-[#FDF8F0] max-h-[calc(92vh-100px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="px-5 py-6 space-y-5 pb-20">
            {/* Image with newspaper caption style */}
            {news.image_url && (
              <figure className="border border-gray-300">
                <img
                  src={news.image_url}
                  alt={displayCaption || news.rewritten_title}
                  className="w-full h-auto object-cover grayscale-[20%] contrast-[1.05]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {(displayCaption || cleanedCredits) && (
                  <figcaption className="bg-[#F5F0E6] px-3 py-2 text-xs text-gray-700 border-t border-gray-300 font-sans line-clamp-1">
                    {displayCaption && cleanedCredits ? (
                      <span>{displayCaption} — <span className="text-gray-500">{cleanedCredits}</span></span>
                    ) : displayCaption ? (
                      <span>{displayCaption}</span>
                    ) : cleanedCredits ? (
                      <span className="text-gray-500">{cleanedCredits}</span>
                    ) : null}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Article content with drop cap - font size controlled by state */}
            <article 
              className={`text-gray-900 text-justify hyphens-auto transition-all duration-200 ${fontSizeClasses[fontSizeLevel]}`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {/* Drop cap for first paragraph */}
              <p className="first-letter:float-left first-letter:text-[3.5rem] first-letter:font-bold first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-black">
                {news.rewritten_content}
              </p>
            </article>

            {/* Footer decoration */}
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

export default NewsCard;
