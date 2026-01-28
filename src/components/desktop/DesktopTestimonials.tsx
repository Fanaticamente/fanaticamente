import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rodrigo Machado",
    role: "Psicólogo",
    text: "O Fanaticamente traz uma proposta inovadora ao unir a paixão pelo futebol com o cuidado da saúde mental. A ideia de conectar torcedores com profissionais que compartilham a mesma paixão cria um vínculo único na terapia.",
    avatar: "R",
  },
  {
    name: "Carolina Mendes",
    role: "Psicóloga",
    text: "A plataforma facilita muito o acesso de torcedores a um atendimento especializado. A interface é intuitiva e o ambiente acolhedor permite que os pacientes se sintam à vontade para falar sobre suas emoções.",
    avatar: "C",
  },
  {
    name: "Fernando Alves",
    role: "Sociólogo especialista em comportamento de torcidas",
    text: "O Fanaticamente aborda um tema pouco discutido mas extremamente relevante. A saúde mental dos torcedores precisa de atenção, e essa iniciativa é pioneira no Brasil.",
    avatar: "F",
  },
];

const DesktopTestimonials = () => {
  return (
    <section className="bg-white py-28 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-['Work_Sans'] font-bold text-4xl lg:text-5xl text-emerald-600 mb-4">
            Opinião de Profissionais
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative flex flex-col justify-between min-h-[320px]"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-emerald-500/30" />

              {/* Text */}
              <p className="text-gray-700 mb-8 leading-relaxed pr-10">
                {testimonial.text}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-black">
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
