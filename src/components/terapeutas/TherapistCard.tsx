import { CheckCircle, MapPin, Star, Heart } from "lucide-react";
import { getFirstAndLastName } from "@/lib/utils";

import therapist1 from "@/assets/therapist-1.jpg";
import therapist2 from "@/assets/therapist-2.jpg";
import therapist3 from "@/assets/therapist-3.jpg";
import therapist4 from "@/assets/therapist-4.jpg";

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

const therapistImages = [therapist1, therapist2, therapist3, therapist4];

const TherapistCard = ({ therapist, clubColor, onSelect }: TherapistCardProps) => {
  const imageUrl = therapist.imageUrl || therapistImages[(typeof therapist.id === 'number' ? therapist.id - 1 : 0) % 4];

  const handleClick = () => {
    if (onSelect) {
      onSelect(therapist);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white border-2 rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.01] cursor-pointer"
      style={{ borderColor: clubColor + "40" }}
    >
      {/* Header with club color accent */}
      <div 
        className="h-2"
        style={{ backgroundColor: clubColor }}
      />
      
      <div className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4 mb-3">
          {/* Photo - Vertical Rectangle */}
          <div 
            className="w-20 h-28 sm:w-28 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: clubColor + "60" }}
          >
            <img 
              src={imageUrl} 
              alt={therapist.name}
              className="w-full h-full object-cover object-top"
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

            {/* Hourly Rate */}
            {therapist.hourlyRate && (
              <div 
                className="mt-2 sm:mt-3 inline-block px-3 py-1 rounded-full text-sm font-bold"
                style={{ 
                  backgroundColor: clubColor + "20", 
                  color: clubColor 
                }}
              >
                R$ {therapist.hourlyRate.toFixed(2).replace('.', ',')}
              </div>
            )}

            {/* Sócio Consciente Badge */}
            {therapist.socioConsciente && (
              <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Heart className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                Sócio Consciente
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {therapist.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: clubColor + "20", 
                color: clubColor 
              }}
            >
              {specialty}
            </span>
          ))}
          {therapist.specialties.length > 3 && (
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              +{therapist.specialties.length - 3}
            </span>
          )}
        </div>

        <button
          className="w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg"
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
  );
};

export default TherapistCard;
