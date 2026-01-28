import phoneMockup from "@/assets/desktop/brasileirao-saude-mental-phone.png";

const DesktopChampionship = () => {
  return (
    <section className="bg-white pt-8 pb-16 lg:pt-10 lg:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Phone Mockup */}
          <div className="flex justify-center lg:justify-start">
            <img 
              src={phoneMockup} 
              alt="Brasileirão da Saúde Mental" 
              className="w-[450px] lg:w-[550px] xl:w-[650px] max-w-none object-contain"
            />
          </div>

          {/* Right Column - Text Content */}
          <div className="lg:pl-8">
            <h2 
              className="text-4xl lg:text-5xl text-black font-bold mb-6"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              G-4 ou Z-4?
            </h2>
            
            <p className="text-gray-700 text-base lg:text-lg leading-relaxed max-w-md">
              O Fanaticamente <span className="font-bold">irá monitorar</span> o número de torcedores de cada time que estão cuidando da sua saúde e <span className="font-bold">irá atualizar mensalmente</span> a tabela do <span className="font-bold">Brasileirão da Saúde Mental</span> entregando ao fim do campeonato um troféu simbólico para os clubes que ficarem no G-4!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopChampionship;
