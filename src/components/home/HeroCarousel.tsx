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
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = next, -1 = prev
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "entering">("idle");
  const [transitionIntensity, setTransitionIntensity] = useState(1); // 0.4 (slow) -> 1.6 (fast)
  const [glitch, setGlitch] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const moduleQuery = useModuleConfig("hero_carousel");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
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
    setPrevSlide(null);
    setImagesLoaded({});
  }, [moduleQuery.data]);

  const goToSlide = (next: number, dir: 1 | -1, intensity = 1) => {
    setDirection(dir);
    setTransitionIntensity(intensity);
    setPrevSlide(currentSlide);
    setCurrentSlide(next);
    // trigger entering phase on next frame so CSS transition runs from start->end
    setTransitionPhase("idle");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionPhase("entering"));
    });
    // glitch flash
    setGlitch(true);
    window.setTimeout(() => setGlitch(false), 180);
    // clear trail after animation finishes
    const duration = Math.max(450, 900 / intensity);
    window.setTimeout(() => {
      setPrevSlide(null);
      setTransitionPhase("idle");
    }, duration + 80);
  };

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next, 1, 0.7); // gentle auto-advance
    }, 5000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, isPaused, currentSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartTime.current = performance.now();
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    if (touchStartX.current !== null) {
      const delta = e.targetTouches[0].clientX - touchStartX.current;
      const w = containerRef.current?.offsetWidth ?? 1;
      const clamped = Math.max(-w, Math.min(w, delta));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);

    if (!touchStartX.current || !touchEndX.current) {
      setDragOffset(0);
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    const elapsed = Math.max(1, performance.now() - touchStartTime.current);
    const velocity = Math.abs(diff) / elapsed; // px per ms
    // Map velocity to intensity: slow ~0.4, fast ~1.6
    const intensity = Math.min(1.8, Math.max(0.4, velocity * 2.2));
    const minSwipeDistance = 50;

    setDragOffset(0);
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToSlide((currentSlide + 1) % slides.length, 1, intensity);
      } else {
        goToSlide((currentSlide - 1 + slides.length) % slides.length, -1, intensity);
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

  // Render order: prev (exiting / trail) below, current (entering) on top
  const renderOrder = prevSlide !== null && prevSlide !== currentSlide
    ? [prevSlide, currentSlide]
    : [currentSlide];

  const baseDuration = Math.max(450, 900 / transitionIntensity); // ms

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-background select-none"
      style={{ aspectRatio: '1/1', maxHeight: '1080px', WebkitUserSelect: 'none', touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Cinematic stage */}
      <div className="absolute inset-0">
        {renderOrder.map((index) => {
          const slide = slides[index];
          if (!slide) return null;
          const isCurrent = index === currentSlide;
          const isPrev = index === prevSlide && !isCurrent;

          // Drag follow (only the current slide follows finger live)
          const dragPx = isCurrent ? dragOffset : 0;

          // Entering animation: starts off-screen in the swipe direction, lands at 0
          // direction = 1 means user swiped left (next) => new slide enters from RIGHT (+100%)
          let translatePct = 0;
          let rotateDeg = 0;
          let blurPx = 0;
          let opacity = 1;

          if (isCurrent) {
            if (transitionPhase === "idle" && prevSlide !== null && prevSlide !== currentSlide) {
              // start frame
              translatePct = direction * 100;
              rotateDeg = direction * 4 * transitionIntensity;
              blurPx = 14 * transitionIntensity;
              opacity = 0.4;
            } else {
              translatePct = 0;
              rotateDeg = 0;
              blurPx = 0;
              opacity = 1;
            }
          } else if (isPrev) {
            // exits in the opposite direction (current came from +dir, prev goes to -dir)
            // keep it visible as a trail until the new slide covers it
            translatePct = -direction * 60;
            rotateDeg = -direction * 3 * transitionIntensity;
            blurPx = 10 * transitionIntensity;
            opacity = 1;
          }

          return (
            <div
              key={`${index}-${isCurrent ? "cur" : "prev"}`}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(calc(${translatePct}% + ${dragPx}px), 0, 0) rotate(${rotateDeg}deg)`,
                filter: `blur(${blurPx}px)`,
                opacity,
                transition: dragOffset !== 0 && isCurrent
                  ? "none"
                  : `transform ${baseDuration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${baseDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${Math.round(baseDuration * 0.8)}ms ease-out`,
                zIndex: isCurrent ? 20 : 10,
                pointerEvents: isCurrent ? "auto" : "none",
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Background Image */}
                <img
                  src={slide.image}
                  alt={slide.title || "Banner principal"}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onLoad={() => handleImageLoad(index)}
                />

                {/* Speed streak overlay during transitions */}
                {(isCurrent && transitionPhase === "entering" && prevSlide !== null) && (
                  <div
                    className="pointer-events-none absolute inset-0 mix-blend-screen"
                    style={{
                      background: `linear-gradient(${direction > 0 ? 90 : 270}deg, transparent 0%, hsl(var(--primary) / 0.18) 40%, hsl(var(--primary) / 0.28) 50%, hsl(var(--primary) / 0.18) 60%, transparent 100%)`,
                      opacity: 0.7,
                      animation: `speedStreak ${baseDuration}ms ease-out forwards`,
                    }}
                  />
                )}

                {/* Dark overlay gradient */}
                {slide.showOverlay !== false && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                )}

                {/* Glitch RGB-split flash on transition */}
                {isCurrent && glitch && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 mix-blend-screen"
                      style={{
                        background: "rgba(255, 0, 60, 0.18)",
                        transform: "translate3d(-3px, 0, 0)",
                        animation: "glitchFlash 180ms steps(2, end) forwards",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 mix-blend-screen"
                      style={{
                        background: "rgba(0, 200, 255, 0.18)",
                        transform: "translate3d(3px, 0, 0)",
                        animation: "glitchFlash 180ms steps(2, end) forwards",
                      }}
                    />
                  </>
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
    </div>
  );
};

export default HeroCarousel;