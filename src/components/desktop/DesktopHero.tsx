import DesktopHeroCarousel from "./DesktopHeroCarousel";

const DesktopHero = () => {
  return (
    <>
      {/* Hero Carousel */}
      <DesktopHeroCarousel />

      {/* Intro Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Column - Main Title */}
            <div>
              <h2 
                className="text-4xl lg:text-5xl xl:text-[56px] text-black font-bold leading-[1.1]"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Transformando a forma que os torcedores se conectam com sua saúde mental
              </h2>
            </div>

            {/* Right Column - Card */}
            <div className="bg-[#f5f5f5] rounded-lg p-8 lg:p-10">
              <h3 
                className="text-xl lg:text-2xl font-bold text-black mb-4"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Juntos somos muitos
              </h3>
              <p className="text-base lg:text-lg text-black leading-relaxed">
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
