import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

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
}

const defaultSlides: SlideConfig[] = [
  {
    title: "CUIDE DA MENTE",
    subtitle: "Jogue com equilíbrio",
    cta: "COMEÇAR AGORA",
    ctaLink: "/terapeutas",
    image: heroSlide1,
    titleColor: "#FFFFFF",
    subtitleColor: "#FFFFFF",
  },
  {
    title: "ENCONTRE SEU TERAPEUTA",
    subtitle: "Psicólogos especializados em torcedores",
    cta: "AGENDAR CONSULTA",
    ctaLink: "/terapeutas",
    image: heroSlide2,
    titleColor: "#FFFFFF",
    subtitleColor: "#FFFFFF",
  },
  {
    title: "COMUNIDADE FANÁTICA",
    subtitle: "Apoio emocional entre torcedores",
    cta: "PARTICIPAR",
    ctaLink: "/quiz",
    image: heroSlide3,
    titleColor: "#FFFFFF",
    subtitleColor: "#FFFFFF",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dbImagesLoaded, setDbImagesLoaded] = useState(false);
  const moduleQuery = useModuleConfig("hero_carousel");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const dbSlides = (moduleQuery.data?.config as { slides?: SlideConfig[] } | undefined)?.slides;
  
  // Use default slides immediately, then switch to DB slides when loaded
  const slides: SlideConfig[] = dbImagesLoaded && dbSlides ? dbSlides : defaultSlides;

  // Pre-load DB images in background
  useEffect(() => {
    if (!dbSlides || dbSlides.length === 0) {
      setDbImagesLoaded(false);
      return;
    }

    const firstSrc = dbSlides[0]?.image;
    if (!firstSrc) {
      setDbImagesLoaded(true);
      return;
    }

    const img = new Image();
    img.src = firstSrc;
    img.onload = () => {
      setDbImagesLoaded(true);
      setCurrentSlide(0);
    };
    img.onerror = () => setDbImagesLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [dbSlides]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe left - next slide
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        // Swipe right - previous slide
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getFontClass = (font?: string) => {
    switch (font) {
      case "font-sans":
        return "font-sans";
      case "font-serif":
        return "font-serif";
      case "font-mono":
        return "font-mono";
      default:
        return "font-display";
    }
  };

  return (
    <div 
      className="relative w-full overflow-hidden" 
      style={{ aspectRatio: '1/1', maxHeight: '1080px' }}
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
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6 pb-16">
            <h2 
              className={`${getFontClass(slide.titleFont)} text-4xl md:text-5xl font-bold mb-2 tracking-tight`}
              style={{ color: slide.titleColor || "#FFFFFF" }}
            >
              {slide.title}
            </h2>
            <p 
              className={`${getFontClass(slide.subtitleFont)} text-lg mb-6`}
              style={{ color: slide.subtitleColor || "#FFFFFF", opacity: 0.8 }}
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