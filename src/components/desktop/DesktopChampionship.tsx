import phoneMockup from "@/assets/desktop/brasileirao-saude-mental-phone.png";

const DesktopChampionship = () => {
  return (
    <section className="bg-white pt-0 pb-16 lg:pt-0 lg:pb-20 lg:-mt-16 xl:-mt-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Phone Mockup */}
          <div className="flex justify-center lg:justify-start lg:-ml-20 xl:-ml-32">
            <img 
              src={phoneMockup} 
              alt="Brasileirão da Saúde Mental" 
              className="w-[650px] lg:w-[800px] xl:w-[950px] max-w-none object-contain"
            />
          </div>

          {/* Right Column - Text Content */}
          <div className="lg:pl-24 xl:pl-40">
            <h2 
              className="text-4xl lg:text-5xl text-emerald-400 font-bold mb-6"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              G-4 ou Z-4?
            </h2>
            
            <p className="text-gray-700 text-base lg:text-lg leading-relaxed max-w-md">
              O Fanaticamente irá monitorar o número de torcedores de cada time que estão cuidando da sua saúde e irá atualizar mensalmente a tabela do <span className="font-bold">Brasileirão da Saúde Mental</span> entregando ao fim do campeonato um troféu simbólico para os clubes que ficarem no G-4!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopChampionship;
