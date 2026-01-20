import iconJersey from "@/assets/desktop/icon-jersey.png";
import macMockup from "@/assets/desktop/mac-mockup.png";
import brasileiraoSaudeMental from "@/assets/desktop/brasileirao-saude-mental.png";

const DesktopCuriosities = () => {
  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Curiosidades
          </h2>
          <p className="text-emerald-400 text-lg">
            Experiência inédita
          </p>
        </div>

        {/* Curiosity 1 - Jersey tradition */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="flex-shrink-0">
            <img 
              src={iconJersey} 
              alt="Manto Sagrado" 
              className="w-48 h-48 md:w-64 md:h-64 object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-gray-300 text-lg leading-relaxed">
              Nas sessões de terapia realizadas através da conexão entre terapeuta e paciente pelo Fanaticamente, a tradição do jogo é que ambos vistam os seus <span className="text-emerald-400 font-semibold">mantos sagrados</span> durante a sessão!
            </p>
          </div>
        </div>

        {/* Curiosity 2 - G-4 ou Z-4 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-shrink-0">
            <img 
              src={macMockup} 
              alt="App Mockup" 
              className="w-full max-w-md object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-display text-3xl text-white mb-4">
              G-4 ou Z-4?
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              O Fanaticamente irá monitorar o número de torcedores de cada time que estão cuidando da sua saúde e irá atualizar mensalmente a tabela do <span className="text-emerald-400 font-semibold">Brasileirão da Saúde Mental</span> entregando ao fim do campeonato um troféu simbólico para os clubes que ficarem no G-4!
            </p>
            <img 
              src={brasileiraoSaudeMental} 
              alt="Brasileirão da Saúde Mental" 
              className="w-full max-w-2xl mx-auto md:mx-0 rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopCuriosities;
