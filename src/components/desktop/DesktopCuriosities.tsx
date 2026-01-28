import iconJersey from "@/assets/desktop/icon-jersey.png";
import macVideocall from "@/assets/desktop/mac-videocall.png";

const DesktopCuriosities = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Column - Text Content */}
          <div>
            <h2 
              className="text-4xl lg:text-5xl text-black font-bold mb-8"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Curiosidades
            </h2>
            
            <h3 
              className="text-xl lg:text-2xl text-black font-bold mb-6"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Experiência inédita
            </h3>
            
            <div className="flex items-start gap-6">
              <p className="text-gray-700 text-base lg:text-lg leading-relaxed flex-1">
                Nas sessões de terapia realizadas através da conexão entre terapeuta e paciente pelo Fanaticamente, a tradição do jogo é que ambos vistam os seus <span className="font-bold">mantos sagrados</span> durante a sessão!
              </p>
              <img 
                src={iconJersey} 
                alt="Apito" 
                className="w-32 h-32 lg:w-40 lg:h-40 object-contain flex-shrink-0"
              />
            </div>
          </div>

          {/* Right Column - MacBook Image */}
          <div className="flex justify-center lg:justify-end -mr-20 lg:-mr-40">
            <img 
              src={macVideocall} 
              alt="Videochamada de terapia" 
              className="w-full max-w-3xl lg:max-w-4xl object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopCuriosities;
