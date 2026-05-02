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
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const moduleQuery = useModuleConfig("hero_carousel");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const dbSlides = (moduleQuery.data?.config as { slides?: SlideConfig[] } | undefined)?.slides;

  // Slides are managed entirely by the editor; auto-managed health-news slides
  // (linked via healthNewsId) get a "Saúde" badge and "Ler matéria" CTA at render time.
  const slides: SlideConfig[] = (dbSlides ?? []).map((s) =>
    s.healthNewsId
      ? {
          ...s,
          isHealthNews: true,
          healthBadge: s.healthBadge ?? "Saúde",
          cta: s.cta ?? "Ler matéria",
          ctaLink: s.ctaLink ?? `/setor-saude?artigo=${s.healthNewsId}`,
        }
      : s
  );
  const isLoading = moduleQuery.isLoading || slides.length === 0;

  // Reset state when slides change
  useEffect(() => {
    setCurrentSlide(0);
    setImagesLoaded({});
  }, [moduleQuery.data]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    if (touchStartX.current !== null) {
      const delta = e.targetTouches[0].clientX - touchStartX.current;
      // Clamp drag to container width for parallax feel
      const w = containerRef.current?.offsetWidth ?? 1;
      const clamped = Math.max(-w, Math.min(w, delta));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    setDragOffset(0);

    if (!touchStartX.current || !touchEndX.current) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  const getFontClass = (font?: string) => {
    switch (font) {
      case "font-sans":
        return "font-sans";
      case "font-serif":
        return "font-serif";
      case "font-mono":
        return "font-mono";
      case "font-montserrat":
        return "font-montserrat";
      case "font-poppins":
        return "font-poppins";
      default:
        return "font-display";
    }
  };

  // Show placeholder while loading
  if (isLoading) {
    return (
      <div 
        className="relative w-full overflow-hidden bg-muted animate-pulse" 
        style={{ aspectRatio: '1/1', maxHeight: '1080px' }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden bg-background select-none" 
      style={{ aspectRatio: '1/1', maxHeight: '1080px', WebkitUserSelect: 'none', touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated neon-pulse backdrop */}
      <div
        className="absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, hsl(var(--primary) / 0.25), transparent 60%), radial-gradient(ellipse at 70% 70%, hsl(160 84% 39% / 0.18), transparent 65%), #0a0a0a",
          animation: "depthPulse 8s ease-in-out infinite",
        }}
      />

      {/* Depth Stack scene */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
      >
        {slides.map((slide, index) => {
          const total = slides.length;
          // shortest signed distance from current
          let rel = index - currentSlide;
          if (rel > total / 2) rel -= total;
          if (rel < -total / 2) rel += total;

          // Apply drag-based parallax (in slide units, 1 slide = container width)
          const w = containerRef.current?.offsetWidth ?? 1;
          const dragRel = -dragOffset / w; // dragging right reveals previous (negative rel)
          const r = rel + dragRel;

          const abs = Math.abs(r);
          const isVisible = abs <= 2;
          if (!isVisible) return null;

          // Visual params per offset
          const scale = Math.max(0.6, 1 - abs * 0.18);
          const translateX = r * 62; // % of container
          const translateZ = -abs * 180; // px depth
          const rotateY = r * -8; // degrees
          const blurPx = Math.min(8, abs * 4);
          const opacity = abs > 1.6 ? 0 : Math.max(0.25, 1 - abs * 0.4);
          const zIndex = 100 - Math.round(abs * 10);
          const isCenter = abs < 0.5;

          return (
            <div
              key={index}
              className="absolute"
              style={{
                width: "78%",
                height: "88%",
                transform: `translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                transformStyle: "preserve-3d",
                transition: dragOffset === 0
                  ? "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, filter 500ms ease"
                  : "none",
                opacity,
                filter: `blur(${blurPx}px)`,
                zIndex,
                pointerEvents: isCenter ? "auto" : "none",
              }}
              onClick={() => {
                if (!isCenter) {
                  setCurrentSlide(index);
                }
              }}
            >
              <div
                className="relative w-full h-full overflow-hidden rounded-3xl"
                style={{
                  boxShadow: isCenter
                    ? "0 30px 80px -10px hsl(var(--primary) / 0.55), 0 0 0 1px hsl(var(--primary) / 0.35), 0 0 60px hsl(var(--primary) / 0.25)"
                    : "0 20px 50px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                {/* Background Image */}
                <img
                  src={slide.image}
                  alt={slide.title || "Banner principal"}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    imagesLoaded[index] ? "opacity-100" : "opacity-0"
                  }`}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  onLoad={() => handleImageLoad(index)}
                />

                {/* Dark overlay gradient - conditionally rendered */}
                {slide.showOverlay !== false && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                )}

                {/* Subtle inner glow on center */}
                {isCenter && (
                  <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                )}

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-6 pb-10">
                  {slide.isHealthNews && (
                    <div className="inline-flex items-center gap-1.5 self-start mb-3 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm">
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

                  {slide.cta && slide.ctaLink && isCenter && (
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

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-[200]">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-primary w-8"
                : "bg-foreground/30 w-2 hover:bg-foreground/50"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;