import { MapPin, Star } from "lucide-react";

import silhouetteMale1 from "@/assets/silhouette-male-1.jpg";
import silhouetteFemale1 from "@/assets/silhouette-female-1.jpg";
import silhouetteMale2 from "@/assets/silhouette-male-2.jpg";
import silhouetteFemale2 from "@/assets/silhouette-female-2.jpg";

const silhouetteImages = [silhouetteMale1, silhouetteFemale1, silhouetteMale2, silhouetteFemale2];

interface VacancyCardProps {
  index: number;
  clubColor: string;
  clubName: string;
}

const VacancyCard = ({ index, clubColor, clubName }: VacancyCardProps) => {
  const imageUrl = silhouetteImages[index % 4];

  const handleIndique = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de indicar um(a) profissional de psicologia para atender a torcida do ${clubName} no app Fanáticamente!`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleCadastre = () => {
    window.location.href = "/auth?role=professional";
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
            style={{ borderColor: clubColor + "60" }}
          >
            <img
              src={imageUrl}
              alt="Vaga aberta"
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-sans text-lg sm:text-xl font-bold uppercase"
              style={{ color: clubColor }}
            >
              VAGA ABERTA
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

        <div className="flex flex-wrap gap-2 mb-4">
          {["Psicologia Esportiva", "Ansiedade", "Bem-estar"].map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 text-xs rounded-full"
              style={{
                backgroundColor: clubColor + "15",
                color: clubColor + "80",
              }}
            >
              {specialty}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleIndique}
            className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] border-2"
            style={{
              borderColor: clubColor,
              color: clubColor,
              backgroundColor: "transparent",
            }}
          >
            Indique
          </button>
          <button
            onClick={handleCadastre}
            className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg"
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
    </div>
  );
};

export default VacancyCard;
