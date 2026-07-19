import { ShieldCheck, Shirt, Star, ChevronRight, Bookmark, X, Shield } from "lucide-react";
import { useState } from "react";
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
    "isis", "ísis", "raquel", "isabel", "cris", "esther", "ruth",
    "judith", "abigail", "carmen", "miriam", "myriam", "eunice",
    "dolores", "solange", "heloise", "eloise", "eloá", "eloa", "agnes",
    "damaris", "noemi", "noemí", "rebeca", "sarai", "tamar",
    "yasmin", "jasmin", "carol", "sol", "flor", "mel",
  ]);
  if (femaleOverrides.has(first)) return true;
  return /a$/.test(first);
};

const inferRoleLabel = (degree: string, female: boolean) => {
  const d = (degree || "").toLowerCase();
  if (d.includes("nutric")) return "Nutricionista";
  if (d.includes("fisio")) return "Fisioterapeuta";
  if (d.includes("psiqui")) return female ? "Psiquiatra" : "Psiquiatra";
  if (d.includes("terapeuta ocup")) return "Terapeuta Ocupacional";
  return female ? "Psicóloga" : "Psicólogo";
};

const inferCredentialLabel = (degree: string) => {
  const d = (degree || "").toLowerCase();
  if (d.includes("nutric")) return "CRN";
  if (d.includes("fisio")) return "CREFITO";
  if (d.includes("psiqui")) return "CRM";
  return "CRP";
};

const TherapistCard = ({ therapist, clubColor, clubName, onSelect }: TherapistCardProps) => {
  const hasPhoto = Boolean(therapist.imageUrl);
  const imageUrl = therapist.imageUrl || silhouetteMale;
  const [photoOpen, setPhotoOpen] = useState(false);
  const female = isFemaleName(therapist.name);
  const roleLabel = inferRoleLabel(therapist.degree, female);
  const credentialLabel = inferCredentialLabel(therapist.degree);

  const handleClick = () => {
    if (onSelect) onSelect(therapist);
  };

  // Very light tint for the CTA button background
  const softTint = `color-mix(in oklab, ${clubColor}, white 88%)`;

  return (
    <>
      <div
        onClick={handleClick}
        className="mb-4 rounded-2xl bg-white shadow-md cursor-pointer transition-all hover:shadow-lg overflow-hidden font-sans"
        style={{ borderLeft: `4px solid ${clubColor}` }}
      >
        <div className="p-3 pl-4">
          <div className="flex gap-3">
            {/* Photo */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (hasPhoto) setPhotoOpen(true);
              }}
              className="relative flex-shrink-0 w-[112px] h-[150px] rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in"
            >
              <img
                src={imageUrl}
                alt={therapist.name}
                className={`absolute inset-0 w-full h-full ${
                  hasPhoto ? "object-cover object-top" : "object-contain object-bottom opacity-90"
                }`}
              />
              {therapist.verified && (
                <div
                  className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: "#fff" }}
                  aria-label="Verificado"
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: clubColor }} strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Right content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Name + bookmark */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-sans font-bold text-[17px] text-gray-900 leading-tight capitalize break-words">
                  {getFirstAndLastName(therapist.name).toLowerCase()}
                </h3>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 -mt-0.5 -mr-0.5 text-gray-400 hover:text-gray-600"
                  aria-label="Salvar"
                >
                  <Bookmark className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {/* Role pill + CRP */}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                  style={{ backgroundColor: clubColor }}
                >
                  {roleLabel}
                </span>
                <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                  {credentialLabel} {therapist.crp}
                </span>
              </div>

              {/* Meta: experience | shirt */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Star className="w-4 h-4 flex-shrink-0" style={{ color: clubColor, fill: clubColor }} />
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-gray-800">{therapist.experience} {therapist.experience === 1 ? "ano" : "anos"}</div>
                    <div className="text-[9px] text-gray-500 whitespace-nowrap">de experiência</div>
                  </div>
                </div>
                <div className="w-px h-7 bg-gray-200 flex-shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shirt className="w-4 h-4 flex-shrink-0" style={{ color: clubColor }} strokeWidth={2} />
                  <div className="leading-tight min-w-0">
                    <div className="text-[11px] font-bold text-gray-800 truncate">
                      {female ? "Torcedora" : "Torcedor"}
                    </div>
                    <div className="text-[9px] text-gray-500 truncate max-w-[85px]">
                      {clubName || therapist.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {therapist.socioConsciente && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1"
                    style={{ backgroundColor: `${clubColor}15`, color: clubColor, border: `1px solid ${clubColor}40` }}
                    title={`Sócio Consciente${therapist.clubNickname ? ` ${therapist.clubNickname}` : ''}`}
                  >
                    <Shield className="w-3 h-3" strokeWidth={2.5} />
                    Sócio Consciente
                  </span>
                )}
                {therapist.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-700 border border-gray-200 bg-white whitespace-nowrap"
                  >
                    {s}
                  </span>
                ))}
                {therapist.specialties.length > 3 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-500 border border-gray-200 bg-white whitespace-nowrap">
                    +{therapist.specialties.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="mt-3 w-full py-2.5 rounded-full font-semibold text-sm flex items-center justify-center gap-1 transition-all hover:brightness-95"
            style={{ backgroundColor: softTint, color: clubColor }}
          >
            Ver perfil
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
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