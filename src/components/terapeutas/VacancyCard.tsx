import { MapPin, Star, ChevronRight, ShieldCheck } from "lucide-react";
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

  const accent = `color-mix(in oklab, ${clubColor}, white 55%)`;
  const dark = `color-mix(in oklab, ${clubColor}, black 55%)`;
  const darker = `color-mix(in oklab, ${clubColor}, black 70%)`;

  return (
    <div
      className="mb-4 rounded-3xl overflow-hidden shadow-xl transition-all hover:scale-[1.01]"
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
              className="relative flex-shrink-0 self-end w-[44%] max-w-[190px] h-[240px] sm:h-[260px] rounded-2xl overflow-hidden"
              style={{
                backgroundColor: dark,
              }}
            >
              <img
                src={imageUrl}
                alt="Vaga aberta"
                className="absolute inset-0 w-full h-full object-contain object-bottom opacity-90 rounded-2xl"
                loading="lazy"
              />
              {/* Bottom gradient – photo emerges from the dark panel */}
              <div
                className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none rounded-b-2xl"
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
                  VAGA DISPONÍVEL
                </h3>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: accent }}
                  aria-label="Verificação futura"
                >
                  <ShieldCheck
                    className="w-4 h-4"
                    style={{ color: darker, fill: "none", strokeWidth: 3 }}
                  />
                </div>
              </div>

              {/* Role + CRP */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: accent, color: darker }}
                >
                  Psicólogo(a)
                </span>
                <span className="text-xs text-white/85 font-semibold">CRP ---</span>
              </div>

              {/* Meta */}
              <div className="mt-3 flex items-start gap-3 text-white">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Star
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: accent, fill: accent }}
                  />
                  <div className="leading-tight whitespace-nowrap">
                    <div className="text-[12px] font-bold">-- anos</div>
                    <div className="text-[9px] text-white/70">de experiência</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: accent }}
                  />
                  <div className="leading-tight whitespace-nowrap">
                    <div className="text-[12px] font-bold truncate max-w-[90px]">Brasil</div>
                    <div className="text-[9px] text-white/70">Atendimento online</div>
                  </div>
                </div>
              </div>

              {/* Invitation */}
              <div className="mt-3">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border"
                  style={{
                    backgroundColor: `${accent}20`,
                    color: accent,
                    borderColor: `${accent}60`,
                  }}
                >
                  Torcedor(a) do {clubName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description strip */}
        <div className="bg-white px-4 pt-3 pb-2 flex justify-center border-t border-black/5">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Posição aberta para psicólogos(as) que desejam atender a torcida do{" "}
            <span className="font-semibold" style={{ color: clubColor }}>{clubName}</span>.
          </p>
        </div>

        {/* CTA */}
        <div className="px-4 pb-3 pt-1 bg-white flex justify-center">
          <button
            onClick={handleCadastre}
            className="w-[85%] py-2.5 rounded-full font-display font-bold uppercase tracking-[0.12em] text-base flex items-center justify-center transition-all hover:brightness-105"
            style={{
              backgroundColor: accent,
              color: darker,
              boxShadow: `0 4px 14px ${clubColor}44`,
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              Cadastre-se
              <ChevronRight className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacancyCard;
