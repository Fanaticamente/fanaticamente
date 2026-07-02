import { CheckCircle, MapPin, Star, Heart, X } from "lucide-react";
import { useState, useLayoutEffect, useRef, useEffect } from "react";
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
  onSelect?: (therapist: Therapist) => void;
}

const TherapistCard = ({ therapist, clubColor, onSelect }: TherapistCardProps) => {
  const hasPhoto = Boolean(therapist.imageUrl);
  const imageUrl = therapist.imageUrl || silhouetteMale;
  const [photoOpen, setPhotoOpen] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(therapist.specialties.length);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const containerWidth = el.clientWidth;
      const containerHeight = el.clientHeight;
      if (!containerWidth || !containerHeight) return;

      // Create hidden measurement node
      const ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.visibility = "hidden";
      ghost.style.pointerEvents = "none";
      ghost.style.width = containerWidth + "px";
      ghost.style.display = "flex";
      ghost.style.flexWrap = "wrap";
      ghost.style.gap = "6px";
      document.body.appendChild(ghost);

      const makeTag = (text: string) => {
        const s = document.createElement("span");
        s.textContent = text;
        s.style.padding = "4px 12px";
        s.style.fontSize = "12px";
        s.style.lineHeight = "1.25rem";
        s.style.borderRadius = "9999px";
        s.style.whiteSpace = "nowrap";
        s.style.display = "inline-block";
        return s;
      };

      const total = therapist.specialties.length;
      let best = 0;
      // Try fitting all first, then reduce; leave room for +N if not all fit
      for (let n = total; n >= 0; n--) {
        ghost.innerHTML = "";
        for (let i = 0; i < n; i++) ghost.appendChild(makeTag(therapist.specialties[i]));
        if (n < total) ghost.appendChild(makeTag(`+${total - n}`));
        if (ghost.scrollHeight <= containerHeight + 1) {
          best = n;
          break;
        }
      }
      document.body.removeChild(ghost);
      setVisibleCount(best);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [therapist.specialties]);

  const visibleSpecialties = therapist.specialties.slice(0, visibleCount);
  const hiddenSpecialtiesCount = therapist.specialties.length - visibleSpecialties.length;

  const handleClick = () => {
    if (onSelect) {
      onSelect(therapist);
    }
  };

  return (
    <>
    <div 
      onClick={handleClick}
      className="bg-white border-2 rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.01] cursor-pointer flex flex-col h-[360px] sm:h-[392px]"
      style={{ borderColor: clubColor + "40" }}
    >
      {/* Header with club color accent */}
      <div 
        className="h-2"
        style={{ backgroundColor: clubColor }}
      />
      
      <div className="p-4 sm:p-6 flex flex-col flex-1 min-h-0">
        <div className="flex gap-3 sm:gap-4 mb-3">
          {/* Photo - Vertical Rectangle */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (hasPhoto) setPhotoOpen(true);
            }}
            className="w-28 h-40 sm:w-36 sm:h-48 rounded-xl overflow-hidden flex-shrink-0 border-2 cursor-zoom-in"
            style={{ borderColor: clubColor + "60", backgroundColor: hasPhoto ? undefined : clubColor }}
          >
            <img 
              src={imageUrl} 
              alt={therapist.name}
              className={`w-full h-full ${hasPhoto ? "object-cover object-top" : "object-contain object-center"}`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-0.5">
              <h3
                className="font-sans text-lg sm:text-xl font-bold capitalize truncate"
                style={{ color: clubColor }}
              >
                {getFirstAndLastName(therapist.name).toLowerCase()}
              </h3>
              {therapist.verified && (
                <CheckCircle 
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
                  style={{ color: clubColor }}
                />
              )}
            </div>
            <p className="text-gray-600 text-sm">CRP {therapist.crp}</p>
            <p className="text-gray-600 text-sm mb-2 sm:mb-3">{therapist.degree}</p>

            <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: clubColor }} />
                {therapist.experience} anos
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: clubColor }} />
                {therapist.location}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
              {therapist.hourlyRate && (
                <div
                  className="relative inline-block px-4 py-1 text-sm font-bold rounded-md"
                  style={{ backgroundColor: clubColor + "20", color: clubColor }}
                >
                  <span
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
                    aria-hidden
                  />
                  <span
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
                    aria-hidden
                  />
                  R$ {therapist.hourlyRate.toFixed(2).replace('.', ',')}
                </div>
              )}
              {therapist.socioConsciente && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: clubColor + "15",
                    color: clubColor,
                    borderColor: clubColor + "30",
                  }}
                >
                  <Heart className="w-3.5 h-3.5" style={{ color: clubColor, fill: clubColor }} />
                  Sócio Consciente
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 mb-2">
          <p className="text-xs font-semibold mb-1" style={{ color: clubColor }}>Especialidades</p>
          <div ref={measureRef} className="h-[56px] overflow-hidden">
            <div className="flex flex-wrap gap-1.5">
              {visibleSpecialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-3 py-1 text-xs rounded-full whitespace-nowrap"
                  style={{ backgroundColor: clubColor + "20", color: clubColor }}
                >
                  {specialty}
                </span>
              ))}
              {hiddenSpecialtiesCount > 0 && (
                <span
                  className="px-3 py-1 text-xs rounded-full font-semibold whitespace-nowrap"
                  style={{ backgroundColor: clubColor + "20", color: clubColor }}
                >
                  +{hiddenSpecialtiesCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className="w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg mt-auto"
          style={{ 
            backgroundColor: clubColor, 
            color: "#fff",
            boxShadow: `0 4px 14px ${clubColor}40`
          }}
        >
          Ver Perfil
        </button>
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
