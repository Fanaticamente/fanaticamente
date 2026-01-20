import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Rodrigo Machado",
    role: "Psicólogo - CRP 05/12345",
    text: "O Fanaticamente traz uma proposta inovadora ao unir a paixão pelo futebol com o cuidado da saúde mental. A ideia de conectar torcedores com profissionais que compartilham a mesma paixão cria um vínculo único na terapia.",
    avatar: "R",
  },
  {
    name: "Dra. Carolina Mendes",
    role: "Psicóloga - CRP 06/54321",
    text: "A plataforma facilita muito o acesso de torcedores a um atendimento especializado. A interface é intuitiva e o ambiente acolhedor permite que os pacientes se sintam à vontade para falar sobre suas emoções.",
    avatar: "C",
  },
  {
    name: "Prof. Fernando Alves",
    role: "Sociólogo especialista em comportamento de torcidas",
    text: "O Fanaticamente aborda um tema pouco discutido mas extremamente relevante. A saúde mental dos torcedores precisa de atenção, e essa iniciativa é pioneira no Brasil.",
    avatar: "F",
  },
];

const DesktopTestimonials = () => {
  return (
    <section className="bg-[#111111] py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-emerald-500 uppercase tracking-widest text-sm mb-4">
            Avaliações
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Opinião de Profissionais
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-emerald-500/20" />

              {/* Text */}
              <p className="text-gray-300 mb-8 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesktopTestimonials;
