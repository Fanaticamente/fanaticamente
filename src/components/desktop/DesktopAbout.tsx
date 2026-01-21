const DesktopAbout = () => {
  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-emerald-500 uppercase tracking-widest text-sm mb-4">
            Sobre nós
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-8">
            Nossa história
          </h2>
        </div>

        {/* Story Content */}
        <div className="text-center space-y-6">
          <p className="text-gray-300 text-lg leading-relaxed">
            O aplicativo Fanaticamente foi desenvolvido por um torcedor apaixonado por futebol.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Olhando para seus próprios comportamentos e emoções causadas pelo fanatismo, começou a investir seu tempo em pesquisas para entender as razões das suas emoções.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            As pesquisas e estudos o apresentaram a dados curiosos, interessantes e alguns assustadores.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Outro fator que chamou a atenção, foi o baixo engajamento de entidades máximas com a saúde de quem faz a engrenagem do esporte mais popular do mundo funcionar.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Números estrondosos de atos negativos a todo momento são expostos, enquanto iniciativas e projetos de ação para a melhora no comportamento de um torcedor na sociedade são extintos.
          </p>
          <p className="text-emerald-400 text-xl font-semibold mt-8">
            E foi por isso que uma mente fanática criou o Fanaticamente.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DesktopAbout;
