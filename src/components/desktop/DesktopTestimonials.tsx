import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Eduardo",
    team: "Corinthians",
    text: "Depois de uma derrota importante, eu ficava dias sem conseguir trabalhar direito. Com a terapia, aprendi a separar minha paixão do meu bem-estar.",
    rating: 5,
    avatar: "C",
  },
  {
    name: "Mariana Santos",
    team: "Flamengo",
    text: "A comunidade me ajudou a perceber que não estava sozinha. Outros torcedores passam pelas mesmas emoções intensas que eu.",
    rating: 5,
    avatar: "M",
  },
  {
    name: "Roberto Lima",
    team: "Palmeiras",
    text: "Os cursos da FanatiClass mudaram minha forma de lidar com a ansiedade antes dos jogos. Recomendo demais!",
    rating: 5,
    avatar: "R",
  },
];

const DesktopTestimonials = () => {
  return (
    <section className="py-24 bg-[hsl(var(--desktop-bg))]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl text-[hsl(var(--desktop-fg))] mb-4">
            O que dizem nossos torcedores
          </h2>
          <p className="text-lg text-[hsl(var(--desktop-muted-fg))] max-w-2xl mx-auto">
            Histórias reais de quem aprendeu a viver a paixão com equilíbrio
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[hsl(var(--desktop-card))] rounded-2xl p-8 border border-[hsl(var(--desktop-border))] relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-[hsl(var(--desktop-primary))]/20" />

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-[hsl(var(--desktop-fg))] mb-8 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--desktop-primary))] flex items-center justify-center text-[hsl(var(--desktop-primary-foreground))] font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[hsl(var(--desktop-fg))]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[hsl(var(--desktop-muted-fg))]">
                    Torcedor do {testimonial.team}
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
