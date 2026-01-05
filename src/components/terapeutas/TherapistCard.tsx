import { CheckCircle, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
}

interface TherapistCardProps {
  therapist: Therapist;
  clubColor: string;
  clubSecondaryColor?: string;
}

const therapistImages = [therapist1, therapist2, therapist3, therapist4];

const TherapistCard = ({ therapist, clubColor }: TherapistCardProps) => {
  const navigate = useNavigate();

  const imageUrl = therapist.imageUrl || therapistImages[(typeof therapist.id === 'number' ? therapist.id - 1 : 0) % 4];

  const handleClick = () => {
    navigate(`/terapeuta/${therapist.id}`);
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
      
      <div className="p-6">
        <div className="flex gap-4 mb-4">
          {/* Photo - Vertical Rectangle */}
          <div 
            className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: clubColor + "60" }}
          >
            <img 
              src={imageUrl} 
              alt={therapist.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-display text-xl font-bold"
                style={{ color: clubColor }}
              >
                {therapist.name}
              </h3>
              {therapist.verified && (
                <CheckCircle 
                  className="w-5 h-5" 
                  style={{ color: clubColor }}
                />
              )}
            </div>
            <p className="text-gray-600 text-sm">CRP {therapist.crp}</p>
            <p className="text-gray-600 text-sm mb-3">{therapist.degree}</p>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" style={{ color: clubColor }} />
                {therapist.experience} anos
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" style={{ color: clubColor }} />
                {therapist.location}
              </span>
            </div>

            {/* Hourly Rate */}
            {therapist.hourlyRate && (
              <div 
                className="mt-3 inline-block px-3 py-1 rounded-full text-sm font-bold"
                style={{ 
                  backgroundColor: clubColor + "20", 
                  color: clubColor 
                }}
              >
                R$ {therapist.hourlyRate.toFixed(2).replace('.', ',')}
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