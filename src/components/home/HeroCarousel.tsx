import { useState, useEffect, useRef } from "react";
import { ChevronRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

interface SlideConfig {
  image: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFont?: string;
  subtitleFont?: string;
  showOverlay?: boolean;
  titleSubtitleGap?: number;
  titleLineHeight?: number;
  subtitleLineHeight?: number;
  isHealthNews?: boolean;
  healthBadge?: string;
  healthNewsId?: string;
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(false);
  const moduleQuery = useModuleConfig("hero_carousel");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const dbSlides = (moduleQuery.data?.config as { slides?: SlideConfig[] } | undefined)?.slides;

  // Cache-busting: append a version stamp tied to the module row's updated_at
  // so stale service workers / browser caches can't keep serving old images.
  const updatedAt = (moduleQuery.data as unknown as { updated_at?: string } | undefined)?.updated_at;
  const cacheBust = updatedAt ? new Date(updatedAt).getTime() : 0;
  const withVersion = (url: string) => {
    if (!url || !cacheBust) return url;
    if (url.startsWith("data:") || url.startsWith("blob:")) return url;
    return url.includes("?") ? `${url}&v=${cacheBust}` : `${url}?v=${cacheBust}`;
  };

  const slides: SlideConfig[] = (dbSlides ?? []).map((s) => {
    const base = { ...s, image: withVersion(s.image) };
    return s.healthNewsId
      ? {
          ...base,
          isHealthNews: true,
          healthBadge: s.healthBadge ?? "Saúde",
          cta: s.cta ?? "Ler matéria",
          ctaLink: s.ctaLink ?? `/setor-saude?artigo=${s.healthNewsId}`,
        }
      : base;
  });
  const isLoading = moduleQuery.isLoading || slides.length === 0;

  // Preload all images once slides load
  useEffect(() => {
    slides.forEach((s) => {
      if (s.image) {
        const img = new Image();
        img.src = s.image;
      }
    });
  }, [slides]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [moduleQuery.data]);

  // Trigger speed-streak flash on every slide change
  useEffect(() => {
    setStreak(true);
    const t = window.setTimeout(() => setStreak(false), 600);
    return () => window.clearTimeout(t);
  }, [currentSlide]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentSlide((p) => (p + 1) % slides.length);
      } else {
        setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getFontClass = (font?: string) => {
    switch (font) {
      case "font-sans": return "font-sans";
      case "font-serif": return "font-serif";
      case "font-mono": return "font-mono";
      case "font-montserrat": return "font-montserrat";
      case "font-poppins": return "font-poppins";
      default: return "font-display";
    }
  };

  if (isLoading) {
    return (
      <div
        className="relative w-full overflow-hidden bg-muted animate-pulse"
        style={{ aspectRatio: "1/1", maxHeight: "1080px" }}
      />
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-background select-none"
      style={{ aspectRatio: "1/1", maxHeight: "1080px", touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isCurrent = index === currentSlide;
        return (
          <div
            key={index}
            className="absolute inset-0"
            style={{
              opacity: isCurrent ? 1 : 0,
              transition: "opacity 500ms ease-in-out",
              zIndex: isCurrent ? 20 : 10,
              pointerEvents: isCurrent ? "auto" : "none",
            }}
          >
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title || "Banner principal"}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
              {isCurrent && streak && (
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.18) 40%, hsl(var(--primary) / 0.32) 50%, hsl(var(--primary) / 0.18) 60%, transparent 100%)",
                    animation: "speedStreak 600ms ease-out forwards",
                  }}
                />
              )}
              {slide.showOverlay !== false && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              )}
              <div className="relative h-full flex flex-col justify-end p-6 pb-10">
                {slide.isHealthNews && (
                  <div className="inline-flex items-center gap-1.5 self-start mb-3 px-3 py-1 rounded-full bg-[color:var(--club-500)]/90 backdrop-blur-sm">
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wide">
                      {slide.healthBadge ?? "Saúde"}
                    </span>
                  </div>
                )}
                <h2
                  className={`${getFontClass(slide.titleFont)} ${
                    slide.isHealthNews
                      ? "text-2xl sm:text-3xl md:text-4xl"
                      : "text-3xl sm:text-4xl md:text-5xl"
                  } font-bold tracking-tight`}
                  style={{
                    color: slide.titleColor || "#FFFFFF",
                    lineHeight: slide.titleLineHeight ?? 1.1,
                    marginBottom: `${slide.titleSubtitleGap ?? 8}px`,
                  }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p
                    className={`${getFontClass(slide.subtitleFont)} ${
                      slide.isHealthNews
                        ? "text-sm sm:text-base md:text-lg"
                        : "text-base sm:text-lg md:text-xl"
                    } mb-5`}
                    style={{
                      color: slide.subtitleColor || "#FFFFFF",
                      opacity: 0.85,
                      lineHeight: slide.subtitleLineHeight ?? 1.4,
                    }}
                  >
                    {slide.subtitle}
                  </p>
                )}
                {slide.cta && slide.ctaLink && isCurrent && (
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide w-fit hover:scale-105 transition-transform shadow-lg text-center leading-none"
                  >
                    <span className="leading-none">{slide.cta}</span>
                    <ChevronRight className="w-5 h-5 shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HeroCarousel;
