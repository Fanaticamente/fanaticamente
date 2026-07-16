import {
  ShieldCheck,
  Shirt,
  Star,
  Heart,
  X,
  Zap,
  ChevronRight,
  Brain,
  Frown,
  Users,
  HeartHandshake,
  Flame,
  ShieldAlert,
  Smile,
  Cloud,
  Repeat,
  Sparkles,
  Trophy,
  Activity,
  Target,
  Home,
  Utensils,
  Tag,
} from "lucide-react";
import { useState, useLayoutEffect, useRef, type ComponentType } from "react";
import { getFirstAndLastName } from "@/lib/utils";
import silhouetteMale from "@/assets/silhouette-male.png";

interface AvailableSlot {
  date: Date;
  times: string[];
}

interface Therapist {
  id: number | string;
  name: string;
  crp: string;
  degree: string;
  experience: number;
  location: string;
  specialties: string[];
  verified: boolean;
  availableSlots: AvailableSlot[];
  imageUrl?: string;
  hourlyRate?: number;
  bio?: string;
  socioConsciente?: boolean;
  clubNickname?: string;
}

interface TherapistCardProps {
  therapist: Therapist;
  clubColor: string;
  clubSecondaryColor?: string;
  clubBadgeUrl?: string;
  clubName?: string;
  onSelect?: (therapist: Therapist) => void;
}

const SPECIALTY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Ansiedade": Brain,
  "Depressão": Frown,
  "Terapia de Casais": HeartHandshake,
  "Relacionamentos": Users,
  "Estresse": Flame,
  "Traumas": ShieldAlert,
  "Burnout": Zap,
  "Autoestima": Smile,
  "Luto": Cloud,
  "Fobias": ShieldAlert,
  "TOC": Repeat,
  "TDAH": Sparkles,
  "Psicologia Esportiva": Trophy,
  "Saúde Mental no Esporte": Activity,
  "Performance": Target,
  "Desenvolvimento Pessoal": Sparkles,
  "Conflitos Familiares": Home,
  "Transtornos Alimentares": Utensils,
};

const MAX_VISIBLE_SPECIALTIES = 3;

const SpecialtiesStrip = ({
  specialties,
  accent,
}: {
  specialties: string[];
  accent: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(specialties.length, MAX_VISIBLE_SPECIALTIES),
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const containerWidth = el.clientWidth;
      if (!containerWidth) return;
      // Children: tag pills + optional +N pill (last)
      const gap = 8; // gap-2
      const children = Array.from(el.children) as HTMLElement[];
      // Reset: measure all tag widths (temporarily show all)
      const initialMax = Math.min(specialties.length, MAX_VISIBLE_SPECIALTIES);
      // widths for pills[0..initialMax-1] and the extra pill (if any) at index initialMax
      const widths = children.map((c) => c.getBoundingClientRect().width);
      const hasExtraPill = children.length > initialMax;

      let count = initialMax;
      const fits = (n: number) => {
        const needExtra = hasExtraPill || n < specialties.length;
        let w = 0;
        for (let i = 0; i < n; i++) w += widths[i];
        if (needExtra) {
          const extraW = hasExtraPill ? widths[initialMax] : 32;
          w += extraW;
        }
        const totalGaps =
          Math.max(0, n + (needExtra ? 1 : 0) - 1) * gap;
        return w + totalGaps <= containerWidth;
      };

      while (count > 0 && !fits(count)) count--;
      setVisibleCount(count);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [specialties]);

  const initialMax = Math.min(specialties.length, MAX_VISIBLE_SPECIALTIES);
  const visible = specialties.slice(0, visibleCount);
  const extraCount = specialties.length - visibleCount;

  // Render initialMax pills for measurement, but hide the ones beyond visibleCount.
  const measureList = specialties.slice(0, initialMax);

  return (
    <div
      ref={containerRef}
      className="relative z-10 -mt-4 mb-1 px-4 flex flex-nowrap gap-2 justify-center items-center overflow-hidden"
    >
      {measureList.map((specialty, i) => {
        const Icon = SPECIALTY_ICONS[specialty] || Tag;
        const hidden = i >= visibleCount;
        return (
          <span
            key={specialty}
            className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-white text-gray-800 border border-gray-200 shadow-sm whitespace-nowrap flex-shrink-0"
            style={hidden ? { position: "absolute", visibility: "hidden", pointerEvents: "none" } : undefined}
            aria-hidden={hidden}
          >
            <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white flex-shrink-0">
              <Icon className="w-3 h-3 text-gray-700" />
            </span>
            {specialty}
          </span>
        );
      })}
      {extraCount > 0 && (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold text-white shadow-sm whitespace-nowrap flex-shrink-0"
          style={{ backgroundColor: "#111827" }}
        >
          <span className="font-bold" style={{ color: accent }}>+{extraCount}</span>
        </span>
      )}
    </div>
  );
};

// Heuristic: infer gender from Brazilian Portuguese first name.
const isFemaleName = (fullName: string) => {
  const first = (fullName || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!first) return false;
  const maleExceptions = new Set([
    "luca", "costa", "silva", "andrea", "sasha", "elias", "dias",
    "jonas", "tobias", "matias", "isaias", "aoba",
  ]);
  if (maleExceptions.has(first)) return false;
  const femaleOverrides = new Set([
    "lais", "laís", "ines", "inês", "beatriz", "iris", "íris", "mercedes",
    "isis", "ísis", "raquel", "isabel", "cris", "esther", "esther", "ruth",
    "judith", "abigail", "carmen", "miriam", "myriam", "eunice", "janes",
    "dolores", "solange", "heloise", "eloise", "eloá", "eloa", "agnes",
    "damaris", "hagar", "noemi", "noemí", "rebeca", "sarai", "tamar",
    "yasmin", "jasmin", "carol", "sol", "flor", "mel",
  ]);
  if (femaleOverrides.has(first)) return true;
  return /a$/.test(first);
};

const TherapistCard = ({ therapist, clubColor, clubBadgeUrl, onSelect }: TherapistCardProps) => {
  const hasPhoto = Boolean(therapist.imageUrl);
  const imageUrl = therapist.imageUrl || silhouetteMale;
  const [photoOpen, setPhotoOpen] = useState(false);
  const female = isFemaleName(therapist.name);
  const roleLabel = female ? "Psicóloga" : "Psicólogo";

  const handleClick = () => {
    if (onSelect) {
      onSelect(therapist);
    }
  };

  // Derived club-themed colors using CSS color-mix so it adapts to any club.
  const accent = `color-mix(in oklab, ${clubColor}, white 55%)`;
  const dark = `color-mix(in oklab, ${clubColor}, black 55%)`;
  const darker = `color-mix(in oklab, ${clubColor}, black 70%)`;

  return (
    <>
    <div
      onClick={handleClick}
      className="mb-4 rounded-3xl overflow-hidden shadow-xl cursor-pointer transition-all hover:scale-[1.01]"
      style={{
        boxShadow: `0 10px 30px ${clubColor}30`,
        backgroundColor: clubColor,
        padding: "6px",
      }}
    >
    <div className="rounded-[18px] overflow-hidden bg-white">
      {/* HERO – dark themed panel */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${darker} 0%, ${dark} 55%, ${clubColor} 100%)`,
        }}
      >
        {/* Stadium dots pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1.2px)",
            backgroundSize: "10px 10px",
            WebkitMaskImage:
              "linear-gradient(to left, rgba(0,0,0,0.9), transparent 65%)",
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,0.9), transparent 65%)",
          }}
        />

        <div className="relative flex gap-3 pl-3 pr-4 pt-4 pb-3 min-h-[260px] sm:min-h-[280px]">
          {/* Photo – full-bleed left */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasPhoto) setPhotoOpen(true);
            }}
            className="relative flex-shrink-0 self-end w-[44%] max-w-[190px] h-[240px] sm:h-[260px] cursor-zoom-in rounded-2xl overflow-hidden"
          >
            <img
              src={imageUrl}
              alt={therapist.name}
              className={`absolute inset-0 w-full h-full ${
                hasPhoto ? "object-cover object-top" : "object-contain object-bottom opacity-90"
              } rounded-2xl`}
            />
            {/* Bottom gradient – photo emerges from the dark panel */}
            <div
              className="absolute inset-x-0 bottom-0 h-[30%] pointer-events-none rounded-b-2xl"
              style={{
                background: `linear-gradient(to top, ${darker} 0%, color-mix(in oklab, ${darker}, transparent 40%) 35%, color-mix(in oklab, ${dark}, transparent 70%) 65%, transparent 100%)`,
              }}
            />
          </div>


          {/* Right content */}
          <div className="flex-1 min-w-0 flex flex-col text-white">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-7 sm:h-8 rounded-sm flex-shrink-0 self-center"
                style={{ backgroundColor: accent }}
              />
              <h3 className="flex-1 min-w-0 font-display uppercase leading-[0.9] text-2xl sm:text-3xl tracking-wide break-words">
                {getFirstAndLastName(therapist.name)}
              </h3>
              {therapist.verified && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: accent }}
                  aria-label="Verificado"
                >
                  <ShieldCheck
                    className="w-4 h-4"
                    style={{ color: darker, fill: "none", strokeWidth: 3 }}
                  />
                </div>
              )}
            </div>

            {/* Role + CRP */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: accent, color: darker }}
              >
                {roleLabel}
              </span>
              <span className="text-xs text-white/85 font-semibold">
                CRP {therapist.crp}
              </span>
            </div>

            {/* Meta */}
            <div className="mt-3 flex items-start gap-3 text-white">
              <div className="flex items-center gap-1.5 min-w-0">
                <Star
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: accent, fill: accent }}
                />
                <div className="leading-tight whitespace-nowrap">
                  <div className="text-[12px] font-bold">{therapist.experience} anos</div>
                  <div className="text-[9px] text-white/70">de experiência</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: accent }}
                />
                <div className="leading-tight whitespace-nowrap">
                  <div className="text-[12px] font-bold truncate max-w-[90px]">
                    {therapist.location}
                  </div>
                  <div className="text-[9px] text-white/70">Atendimento online</div>
                </div>
              </div>
            </div>

            {/* Price / Sócio */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {therapist.hourlyRate && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    border: `1.5px solid ${accent}`,
                    backgroundColor: `${darker}80`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ border: `1.5px solid ${accent}` }}
                  >
                    <Zap className="w-4 h-4" style={{ color: accent, fill: accent }} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[9px] uppercase tracking-wider text-white/70 font-semibold">
                      Valor da sessão
                    </div>
                    <div
                      className="font-display text-lg leading-none"
                      style={{ color: accent }}
                    >
                      R$ {therapist.hourlyRate.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </div>
              )}
              {therapist.socioConsciente && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border"
                  style={{
                    backgroundColor: `${accent}20`,
                    color: accent,
                    borderColor: `${accent}60`,
                  }}
                >
                  <Heart
                    className="w-3.5 h-3.5"
                    style={{ color: accent, fill: accent }}
                  />
                  Sócio Consciente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specialties strip – overlaps hero and white area */}
      <SpecialtiesStrip specialties={therapist.specialties} accent={accent} />

      {/* CTA */}
      <div className="px-4 pb-2 pt-1 bg-white flex justify-center">
        <button
          className="w-[85%] py-2 rounded-full font-display font-bold uppercase tracking-[0.12em] text-base flex items-center justify-center transition-all hover:brightness-105"
          style={{
            backgroundColor: accent,
            color: darker,
            boxShadow: `0 4px 14px ${clubColor}44`,
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            Ver Perfil
            <ChevronRight className="w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
    </div>
    {photoOpen && hasPhoto && (
      <div
        onClick={() => setPhotoOpen(false)}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
      >
        <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          <img
            src={imageUrl}
            alt={therapist.name}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl block"
          />
          <button
            onClick={() => setPhotoOpen(false)}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default TherapistCard;
