import iconTherapist from "@/assets/desktop/icon-therapist.png";
import iconEntertainment from "@/assets/desktop/icon-entertainment.png";
import iconKnowledge from "@/assets/desktop/icon-knowledge.png";

const features = [
  {
    icon: iconTherapist,
    title: "Terapeuta também torce, tá?",
    description: "O aplicativo respira futebol. Dentro do app, os usuários encontram equipes de psicoterapeutas que torcem para o mesmo time, ali, prontinhos com suas agendas disponíveis para atender. As terapias não se resumem ao futebol, infinitas questões podem ser tratadas, mas tudo começará pelo assunto que nos conecta, ou seja, a resenha É GARANTIDA!",
  },
  {
    icon: iconEntertainment,
    title: "Entretenimento",
    description: "Além de conectar os usuários/pacientes aos profissionais parceiros da plataforma, ela proporciona também + ambientes de muita descontração como por exemplo o Alambrado FM (podcast oficial da Fanaticamente) e o YouTube @fanaticamente (Principal canal de comunicação da plataforma) ambos canais com muito conteúdo sobre saúde mental e Futebol!",
  },
  {
    icon: iconKnowledge,
    title: "Conhecimento nunca é demais",
    subtitle: "Ainda mais quando o assunto é algo que a gente ama!",
    description: "No Fanaticamente App você irá encontrar o FanatiClass, um portal onde você encontra video-aulas com dicas, mentorias e muitos conteúdos especiais que farão com que o futebol se torne uma experiência cada vez mais sadia na sua vida!",
  },
];

const DesktopFeatures = () => {
  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Funcionalidades
          </h2>
          <p className="text-gray-400 text-lg">
            Saiba mais sobre como funciona o app
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <img 
                  src={feature.icon} 
                  alt={feature.title} 
                  className="w-20 h-20 md:w-24 md:h-24 object-contain"
                />
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display text-2xl md:text-3xl text-white mb-3">
                  {feature.title}
                </h3>
                {feature.subtitle && (
                  <p className="text-emerald-400 text-lg mb-3">{feature.subtitle}</p>
                )}
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesktopFeatures;
