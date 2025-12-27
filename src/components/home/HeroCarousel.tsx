import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Encontre seu Terapeuta",
    subtitle: "Psicólogos especializados em torcedores",
    cta: "Agendar Consulta",
    ctaLink: "/terapeutas",
    gradient: "from-secondary to-secondary/70",
    emoji: "🧠",
  },
  {
    id: 2,
    title: "FanatiClass",
    subtitle: "Cursos para desenvolver inteligência emocional",
    cta: "Explorar Cursos",
    ctaLink: "/cursos",
    gradient: "from-therapy to-therapy/70",
    emoji: "📚",
  },
  {
    id: 3,
    title: "Resenha Fanática",
    subtitle: "Treine sua habilidade de escutar e comunicar",
    cta: "Jogar Agora",
    ctaLink: "/quiz",
    gradient: "from-quiz to-quiz/70",
    emoji: "💬",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 mx-4 my-4 overflow-hidden rounded-2xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`h-full bg-gradient-to-r ${slide.gradient} p-6 flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-4xl mb-2 block">{slide.emoji}</span>
                <h2 className="font-display text-2xl md:text-3xl text-card-foreground mb-1">
                  {slide.title}
                </h2>
                <p className="text-card-foreground/80 text-sm">
                  {slide.subtitle}
                </p>
              </div>
            </div>

            <Link
              to={slide.ctaLink}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide w-fit hover:scale-105 transition-transform"
            >
              {slide.cta}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-primary w-6"
                : "bg-card-foreground/30 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
