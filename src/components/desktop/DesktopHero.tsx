import { Brain } from "lucide-react";
import DesktopHeroCarousel from "./DesktopHeroCarousel";

const DesktopHero = () => {
  return (
    <>
      {/* Hero Carousel */}
      <DesktopHeroCarousel />

      {/* Intro Section */}
      <div className="bg-white py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Column - Main Title */}
            <div>
              <h2 
                className="text-3xl lg:text-4xl xl:text-[44px] text-emerald-600 leading-[1.15]"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Transformando a forma que os <span className="font-bold">torcedores</span> se conectam com sua <span className="font-bold">saúde mental</span>
                <Brain className="w-8 h-8 lg:w-10 lg:h-10 xl:w-11 xl:h-11 text-emerald-600 inline-block ml-2 align-middle" />
              </h2>
            </div>

            {/* Right Column - Card */}
            <div className="bg-emerald-600 rounded-lg p-8 lg:p-10">
              <h3 
                className="text-xl lg:text-2xl font-bold text-white mb-4"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Juntos somos muitos
              </h3>
              <p className="text-base lg:text-lg text-white leading-relaxed">
                No aplicativo <span className="font-bold" style={{ fontFamily: "'Work Sans', sans-serif" }}>Fanaticamente</span>, cada um tem seu clube do coração, mas quando o assunto é saúde mental, todos jogam no <span className="font-bold" style={{ fontFamily: "'Work Sans', sans-serif" }}>mesmo time</span>!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopHero;
