import DesktopHeroCarousel from "./DesktopHeroCarousel";

const DesktopHero = () => {
  return (
    <>
      {/* Hero Carousel */}
      <DesktopHeroCarousel />

      {/* Intro Section */}
      <div className="bg-[#0a0a0a] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-emerald-500 uppercase tracking-widest text-sm mb-4">
            O aplicativo
          </p>
          <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl text-white leading-tight mb-6">
            Transformando a forma que os torcedores se conectam com sua saúde mental
          </h2>
          <p className="text-emerald-400 text-xl mb-6">Juntos somos muitos</p>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            No aplicativo Fanaticamente, cada um tem seu clube do coração, mas quando o assunto é saúde mental, todos jogam no mesmo time!
          </p>
        </div>
      </div>
    </>
  );
};

export default DesktopHero;
