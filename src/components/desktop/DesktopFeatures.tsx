import iconTherapist from "@/assets/desktop/icon-therapist.png";
import iconEntertainment from "@/assets/desktop/icon-entertainment.png";
import iconKnowledge from "@/assets/desktop/icon-knowledge.png";

const DesktopFeatures = () => {
  return (
    <section className="bg-[#1a1a1a] py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="mb-16">
          <h2 
            className="text-4xl lg:text-5xl text-white font-bold mb-3"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            Funcionalidades
          </h2>
          <p className="text-gray-400 text-base">
            Saiba mais sobre como funciona o app
          </p>
        </div>

        {/* Features Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Feature 1 - Terapeuta também torce */}
          <div className="flex flex-col">
            <div className="mb-6">
              <img 
                src={iconTherapist} 
                alt="Terapeuta também torce" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 
              className="text-xl lg:text-2xl text-white font-bold mb-4"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Terapeuta também torce, tá?
            </h3>
            <p className="text-gray-400 text-base leading-relaxed">
              O aplicativo respira futebol. Dentro do app, os usuários encontram equipes de psicoterapeutas que torcem para o mesmo time, ali, prontinhos com suas agendas disponíveis para atender. <span className="font-bold text-white">As terapias não se resumem ao futebol</span>, infinitas questões podem ser tratadas, mas tudo começará pelo assunto que nos conecta, ou seja, a resenha <span className="font-bold text-white">É GARANTIDA!</span>
            </p>
          </div>

          {/* Feature 2 - Entretenimento */}
          <div className="flex flex-col">
            <div className="mb-6">
              <img 
                src={iconEntertainment} 
                alt="Entretenimento" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 
              className="text-xl lg:text-2xl text-white font-bold mb-4"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Entretenimento
            </h3>
            <p className="text-gray-400 text-base leading-relaxed">
              Além de conectar os usuários/pacientes aos profissionais parceiros da plataforma, ela proporciona também <span className="text-white font-bold">+</span> ambientes de muita descontração como por exemplo o{" "}
              <span className="underline text-white">Alambrado FM</span> (podcast oficial da Fanaticamente) e o{" "}
              <span className="underline text-white">YouTube @fanaticamente</span> (Principal canal de comunicação da plataforma) ambos canais com muito conteúdo sobre saúde mental e Futebol!
            </p>
          </div>

          {/* Feature 3 - Conhecimento nunca é demais */}
          <div className="flex flex-col">
            <div className="mb-6">
              <img 
                src={iconKnowledge} 
                alt="Conhecimento nunca é demais" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 
              className="text-xl lg:text-2xl text-white font-bold mb-4"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Conhecimento nunca é demais
            </h3>
            <p className="text-gray-400 text-base leading-relaxed mb-4">
              Ainda mais quando o assunto é algo que a gente ama!
            </p>
            <p className="text-gray-400 text-base leading-relaxed">
              No Fanaticamente App você irá encontrar o <span className="font-bold text-white">FanatiClass</span>, um portal onde você encontra video-aulas com dicas, mentorias e muitos conteúdos especiais que farão com que o futebol se torne uma experiência cada vez mais sadia na sua vida!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopFeatures;
