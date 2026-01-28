const DesktopAbout = () => {
  return (
    <section className="bg-[#0a0a0a] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Title */}
        <h2 className="font-['Work_Sans'] font-bold text-4xl lg:text-5xl xl:text-6xl text-white mb-16 lg:mb-20">
          Nossa história
        </h2>

        {/* Two Column Text Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column */}
          <div className="space-y-6">
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              O aplicativo Fanaticamente foi desenvolvido por
              um <span className="font-semibold text-white">torcedor apaixonado</span> por futebol.
            </p>
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              Olhando para seus próprios comportamentos
              e emoções causadas pelo fanatismo,
              começou a investir seu tempo em pesquisas
              para entender as razões das suas emoções.
              As pesquisas e estudos o apresentaram a
              dados curiosos, interessantes e alguns assustadores.
            </p>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              Outro fator que chamou a atenção, foi o baixo engajamento
              de entidades máximas com a saúde de quem faz a
              engrenagem do esporte mais popular do mundo funcionar.
              Números estrondosos de atos negativos a todo momento são
              expostos, enquanto iniciativas e projetos de ação para a
              melhora no comportamento de um torcedor na sociedade
              são extintos.
            </p>
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              E foi por isso que uma <span className="font-semibold text-white">mente fanática</span> criou o
              {" "}<span className="font-semibold text-white">Fanaticamente</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopAbout;
