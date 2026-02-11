import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
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
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const moduleQuery = useModuleConfig("hero_carousel");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const dbSlides = (moduleQuery.data?.config as { slides?: SlideConfig[] } | undefined)?.slides;
  
  // Only show slides from database - wait for data to load
  const slides: SlideConfig[] = dbSlides ?? [];
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
  };

  const handleTouchEnd = () => {
    setIsPaused(false);

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
      className="relative w-full overflow-hidden bg-background select-none" 
      style={{ aspectRatio: '1/1', maxHeight: '1080px', WebkitUserSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title || "Banner principal"}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => handleImageLoad(index)}
            />
            {/* Dark overlay gradient - conditionally rendered */}
            {slide.showOverlay !== false && (
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            )}
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6 pb-16">
            <h2 
              className={`${getFontClass(slide.titleFont)} text-4xl md:text-5xl font-bold tracking-tight`}
              style={{ 
                color: slide.titleColor || "#FFFFFF",
                lineHeight: slide.titleLineHeight ?? 1.1,
                marginBottom: `${slide.titleSubtitleGap ?? 8}px`
              }}
            >
              {slide.title}
            </h2>
            <p 
              className={`${getFontClass(slide.subtitleFont)} text-lg mb-6`}
              style={{ 
                color: slide.subtitleColor || "#FFFFFF", 
                opacity: 0.8,
                lineHeight: slide.subtitleLineHeight ?? 1.4
              }}
            >
              {slide.subtitle}
            </p>

            {slide.cta && slide.ctaLink && (
              <Link
                to={slide.ctaLink}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide w-fit hover:scale-105 transition-transform shadow-lg"
              >
                {slide.cta}
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
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