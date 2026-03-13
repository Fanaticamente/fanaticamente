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
import { fixTitleCapitalization } from "@/lib/fixTitleCapitalization";

interface NewsCardProps {
  news: FootballNewsItem;
  isFeatured?: boolean;
  accentColor?: string | null;
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

// Clean content to remove photo credits and metadata mixed in text
const cleanNewsContent = (content: string): string => {
  let cleaned = content;
  
  // Remove photo credit patterns like "— Foto: Getty Images" or "Foto: Reprodução"
  cleaned = cleaned.replace(/—?\s*Foto:\s*[^\n]+/gi, '');
  
  // Remove patterns like "Nome — Foto: ..."
  cleaned = cleaned.replace(/[A-Za-zÀ-ú\s]+—\s*Foto:\s*[^\n]+/gi, '');
  
  // Remove duplicate lines (caption repeated)
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  const seen = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      uniqueLines.push(line);
    }
  }
  
  cleaned = uniqueLines.join('\n');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
};


const NewsCard = ({ news, isFeatured = false, accentColor }: NewsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fixedTitle = fixTitleCapitalization(news.rewritten_title);

  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  }).replace(/^cerca de /, '');

  // Clean and get a short preview of the content (first 150 chars)
  const cleanedContent = cleanNewsContent(news.rewritten_content);
  const contentPreview = cleanedContent.slice(0, 150) + (cleanedContent.length > 150 ? "..." : "");

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
                   alt={displayCaption || fixedTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="p-4">
              <span className="inline-block px-3 py-1 text-white text-xs font-bold rounded-full uppercase mb-2" style={{ backgroundColor: accentColor || 'hsl(var(--primary))' }}>
                Destaque
              </span>
              <h2 className="font-sans font-bold text-xl leading-tight text-gray-900 mb-2 transition-colors">
                {fixedTitle}
              </h2>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {contentPreview}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
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

        <NewsDrawer news={news} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 transition-colors group shadow-sm"
      >
        {!imageError && news.image_url ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={news.image_url}
               alt={displayCaption || fixedTitle}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
            ⚽
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-sans font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1 transition-colors">
            {fixedTitle}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded">{news.category}</span>
            <span className="font-medium" style={{ color: accentColor || 'hsl(var(--primary))' }}>Fanaticamente</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" style={{ color: accentColor || 'hsl(var(--primary))' }} />
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
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fixedTitle = fixTitleCapitalization(news.rewritten_title);
  
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  }).replace(/^cerca de /, '');

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
      const textToRead = `${fixedTitle}. ${news.rewritten_content}`;
      
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
  
  // Clean the content
  const cleanedContent = cleanNewsContent(news.rewritten_content);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-white">
        <DrawerHeader className="border-b border-gray-300 pb-4 bg-white px-5">
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
              
              {/* Newspaper headline */}
              <DrawerTitle className="text-2xl sm:text-3xl font-sans font-bold text-black leading-tight tracking-tight text-left">
                {news.rewritten_title}
              </DrawerTitle>
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
        <div className="flex-1 overflow-y-auto bg-white max-h-[calc(92vh-100px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  <figcaption className="bg-gray-50 px-3 py-2 text-xs text-gray-700 border-t border-gray-300 font-sans line-clamp-2">
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
                {cleanedContent}
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
