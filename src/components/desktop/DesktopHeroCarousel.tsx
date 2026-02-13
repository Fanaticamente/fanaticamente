import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const defaultSlides: Slide[] = [
  {
    image: heroSlide1,
    title: "CRIADO POR QUEM SENTE.",
    subtitle: "A primeira plataforma do mundo focada na saúde mental dos torcedores de futebol.",
  },
  {
    image: heroSlide2,
    title: "PARA QUEM VIBRA.",
    subtitle: "Conectamos você aos melhores profissionais que entendem a paixão pelo futebol.",
  },
  {
    image: heroSlide3,
    title: "JUNTOS SOMOS MUITOS.",
    subtitle: "Cada um com seu clube, mas todos no mesmo time pela saúde mental.",
  },
];

const DesktopHeroCarousel = () => {
  const { data: moduleConfig } = useModuleConfig("desktop_hero_carousel");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Get slides from database config or use defaults
  const config = moduleConfig?.config as { slides?: Slide[] } | undefined;
  const slides: Slide[] = config?.slides?.length ? config.slides : defaultSlides;

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative w-full h-[60vh] sm:h-[75vh] lg:h-[90vh] min-h-[400px] lg:min-h-[600px] overflow-hidden bg-[#0a0a0a]">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background Image - No overlay */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content - Title and Subtitle only */}
          <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-16 sm:pb-20 lg:pb-24">
            <div className="max-w-2xl">
              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-white leading-tight mb-4 sm:mb-6 tracking-tight drop-shadow-lg">
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-gray-300 text-base sm:text-lg lg:text-2xl leading-relaxed max-w-xl drop-shadow-md">
                {slide.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-emerald-500 w-8"
                : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default DesktopHeroCarousel;
