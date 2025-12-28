import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ModuleConfig } from "@/hooks/useAppModules";

import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

const defaultSlides = [
  {
    id: 1,
    title: "CUIDE DA MENTE",
    subtitle: "Jogue com equilíbrio",
    cta: "COMEÇAR AGORA",
    ctaLink: "/terapeutas",
    image: heroSlide1,
  },
  {
    id: 2,
    title: "ENCONTRE SEU TERAPEUTA",
    subtitle: "Psicólogos especializados em torcedores",
    cta: "AGENDAR CONSULTA",
    ctaLink: "/terapeutas",
    image: heroSlide2,
  },
  {
    id: 3,
    title: "COMUNIDADE FANÁTICA",
    subtitle: "Apoio emocional entre torcedores",
    cta: "PARTICIPAR",
    ctaLink: "/quiz",
    image: heroSlide3,
  },
];

interface HeroCarouselProps {
  config?: ModuleConfig;
}

const HeroCarousel = ({ config }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = config?.slides?.length 
    ? config.slides.map((slide, index) => ({
        id: index + 1,
        title: slide.title || defaultSlides[index]?.title || "",
        subtitle: slide.subtitle || defaultSlides[index]?.subtitle || "",
        cta: slide.cta || defaultSlides[index]?.cta || "SAIBA MAIS",
        ctaLink: slide.ctaLink || defaultSlides[index]?.ctaLink || "/",
        image: slide.image || defaultSlides[index]?.image || heroSlide1,
      }))
    : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative h-[70vh] min-h-[480px] max-h-[600px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
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
