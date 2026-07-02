import { MapPin, Star } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

import silhouetteMale from "@/assets/silhouette-male.png";
import silhouetteFemale from "@/assets/silhouette-female.png";

const silhouetteImages = [silhouetteMale, silhouetteFemale, silhouetteMale, silhouetteFemale];

const IOS_APP_URL = "https://apps.apple.com/br/app/fanaticawork-psic%C3%B3logos-as/id6769204005";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=br.com.fanaticamente.fanaticawork&pcampaignid=web_share";

interface VacancyCardProps {
  index: number;
  clubColor: string;
  clubName: string;
}

const VacancyCard = ({ index, clubColor, clubName }: VacancyCardProps) => {
  const imageUrl = silhouetteImages[index % 4];

  const handleCadastre = async () => {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const targetUrl = isAndroid ? ANDROID_APP_URL : IOS_APP_URL;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: targetUrl });
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
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
            className="w-28 h-40 sm:w-36 sm:h-48 rounded-xl overflow-hidden flex-shrink-0 border-2"
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
          Esta é uma posição disponível para psicólogos(as) torcedores(as) do{" "}
          <span className="font-semibold" style={{ color: clubColor }}>{clubName}</span> que desejam
          atender a torcida. Cadastre-se para integrar o time!
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
