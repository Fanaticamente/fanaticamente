import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import silhouetteMale from "@/assets/silhouette-male.png";
import silhouetteFemale from "@/assets/silhouette-female.png";

const silhouetteImages = [silhouetteMale, silhouetteFemale, silhouetteMale, silhouetteFemale];

interface VacancyCardProps {
  index: number;
  clubColor: string;
  clubName: string;
}

const VacancyCard = ({ index, clubColor, clubName }: VacancyCardProps) => {
  const imageUrl = silhouetteImages[index % 4];
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleCadastre = async () => {
    if (user) {
      await signOut();
    }
    navigate("/auth?mode=professional&signup=true");
  };

  return (
    <div
      className="bg-white border-2 rounded-2xl overflow-hidden mb-4 transition-all"
      style={{ borderColor: clubColor + "40" }}
    >
      <div className="h-2" style={{ backgroundColor: clubColor }} />

      <div className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4 mb-3">
          {/* Photo */}
          <div
            className="w-20 h-28 sm:w-28 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{
              borderColor: clubColor + "60",
              backgroundColor: clubColor,
            }}
          >
            <img
              src={imageUrl}
              alt="Vaga aberta"
              className="w-full h-full object-contain object-center"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-sans text-lg sm:text-xl font-bold uppercase"
              style={{ color: clubColor }}
            >
              VAGA DISPONÍVEL
            </h3>
            <p className="text-gray-400 text-sm">CRP ---</p>
            <p className="text-gray-400 text-sm mb-2 sm:mb-3">Psicólogo(a)</p>

            <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: clubColor + "60" }} />
                -- anos
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: clubColor + "60" }} />
                Brasil
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Esta é uma posição disponível para psicólogos(as) que desejam atender a torcida do{" "}
          <span className="font-semibold" style={{ color: clubColor }}>{clubName}</span>. Cadastre-se
          para integrar nosso corpo clínico e oferecer cuidado especializado a esta comunidade.
        </p>

        <button
          onClick={handleCadastre}
          className="w-full py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: clubColor,
            color: "#fff",
            boxShadow: `0 4px 14px ${clubColor}40`,
          }}
        >
          Cadastre-se
        </button>
      </div>
    </div>
  );
};

export default VacancyCard;
