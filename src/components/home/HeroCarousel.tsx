import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppModules, type ModuleConfig } from "@/hooks/useAppModules";

import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

// Fallback slides if database is empty
const fallbackSlides = [
  {
    title: "CUIDE DA MENTE",
    subtitle: "Jogue com equilíbrio",
    cta: "COMEÇAR AGORA",
    ctaLink: "/terapeutas",
    image: heroSlide1,
  },
  {
    title: "ENCONTRE SEU TERAPEUTA",
    subtitle: "Psicólogos especializados em torcedores",
    cta: "AGENDAR CONSULTA",
    ctaLink: "/terapeutas",
    image: heroSlide2,
  },
  {
    title: "COMUNIDADE FANÁTICA",
    subtitle: "Apoio emocional entre torcedores",
    cta: "PARTICIPAR",
    ctaLink: "/quiz",
    image: heroSlide3,
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: modules } = useAppModules("home");
  
  // Find the hero_carousel module
  const carouselModule = modules?.find(m => m.module_id === 'hero_carousel');
  const config = carouselModule?.config as ModuleConfig | undefined;
  
  // Use database slides or fallback
  const slides = config?.slides && config.slides.length > 0
    ? config.slides.map((slide, index) => ({
        title: slide.title || `Slide ${index + 1}`,
        subtitle: slide.subtitle || '',
        cta: slide.cta || 'SAIBA MAIS',
        ctaLink: slide.ctaLink || '/',
        image: slide.image || fallbackSlides[index % fallbackSlides.length]?.image || heroSlide1,
      }))
    : fallbackSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative h-[70vh] min-h-[480px] max-h-[600px] w-full overflow-hidden">
      {/* Dimension hint for developers */}
      <div className="absolute top-2 right-2 z-10 bg-background/80 text-xs text-muted-foreground px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        Recomendado: 1080 x 540 px
      </div>
      
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
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6 pb-16">
            <h2 className="font-display text-4xl md:text-5xl text-foreground font-bold mb-2 tracking-tight">
              {slide.title}
            </h2>
            <p className="text-foreground/80 text-lg mb-6">
              {slide.subtitle}
            </p>

            <Link
              to={slide.ctaLink}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide w-fit hover:scale-105 transition-transform shadow-lg"
            >
              {slide.cta}
              <ChevronRight className="w-5 h-5" />
            </Link>
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
