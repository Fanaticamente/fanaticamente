import { Shirt, Star, ChevronRight, Bookmark, ShieldCheck } from "lucide-react";
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

  const softTint = `color-mix(in oklab, ${clubColor}, white 88%)`;

  return (
    <div
      onClick={handleCadastre}
      className="mb-4 rounded-2xl bg-white shadow-md cursor-pointer transition-all hover:shadow-lg overflow-hidden font-sans"
      style={{ borderLeft: `4px solid ${clubColor}` }}
    >
      <div className="p-3 pl-4">
        <div className="flex gap-3">
          <div className="relative flex-shrink-0 w-[112px] h-[150px] rounded-2xl overflow-hidden bg-gray-100 flex items-end justify-center">
            <img src={imageUrl} alt="Vaga aberta" className="w-full h-full object-contain object-bottom opacity-70" loading="lazy" />
            <div
              className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-white"
              aria-label="Vaga aberta"
            >
              <ShieldCheck className="w-4 h-4" style={{ color: clubColor }} strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-sans font-bold text-[17px] text-gray-900 leading-tight">
                Vaga Disponível
              </h3>
              <Bookmark className="w-5 h-5 text-gray-300 flex-shrink-0" strokeWidth={2} />
            </div>

            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                style={{ backgroundColor: clubColor }}
              >
                Profissional
              </span>
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                Registro ---
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4" style={{ color: clubColor, fill: clubColor }} />
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-gray-800">-- anos</div>
                  <div className="text-[9px] text-gray-500">de experiência</div>
                </div>
              </div>
              <div className="w-px h-7 bg-gray-200" />
              <div className="flex items-center gap-1.5 min-w-0">
                <Shirt className="w-4 h-4 flex-shrink-0" style={{ color: clubColor }} strokeWidth={2} />
                <div className="leading-tight min-w-0">
                  <div className="text-[11px] font-bold text-gray-800 truncate">Torcedor(a)</div>
                  <div className="text-[9px] text-gray-500 truncate max-w-[90px]">{clubName}</div>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] text-gray-600 leading-snug">
              Vaga aberta para profissionais que desejam atender a torcida do{" "}
              <span className="font-semibold" style={{ color: clubColor }}>{clubName}</span>.
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCadastre();
          }}
          className="mt-3 w-full py-2.5 rounded-full font-semibold text-sm flex items-center justify-center gap-1 transition-all hover:brightness-95"
          style={{ backgroundColor: softTint, color: clubColor }}
        >
          Cadastre-se
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default VacancyCard;