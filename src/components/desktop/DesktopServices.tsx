import { Link } from "react-router-dom";
import { Brain, Users, BookOpen, Radio, ShoppingBag, MessageCircle } from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "Psicólogos Especializados",
    description: "Profissionais que entendem a paixão pelo futebol e como ela afeta suas emoções.",
    link: "/terapeutas",
    color: "262 83% 58%",
  },
  {
    icon: Users,
    title: "Comunidade de Apoio",
    description: "Conecte-se com outros torcedores que compartilham das mesmas experiências.",
    link: "/quiz",
    color: "145 63% 32%",
  },
  {
    icon: BookOpen,
    title: "FanatiClass",
    description: "Cursos e conteúdos exclusivos sobre saúde mental no universo do futebol.",
    link: "/cursos",
    color: "45 100% 51%",
  },
  {
    icon: Radio,
    title: "Alambrado FM",
    description: "Podcast e rádio com discussões saudáveis sobre futebol e bem-estar.",
    link: "/radio",
    color: "15 80% 50%",
  },
  {
    icon: ShoppingBag,
    title: "Loja Fanática",
    description: "Produtos exclusivos que celebram sua paixão pelo clube de coração.",
    link: "/loja",
    color: "210 100% 45%",
  },
  {
    icon: MessageCircle,
    title: "Diário do Torcedor",
    description: "Registre suas emoções e acompanhe sua jornada emocional ao longo da temporada.",
    link: "/diario",
    color: "280 60% 50%",
  },
];

const DesktopServices = () => {
  return (
    <section className="py-24 bg-[hsl(var(--desktop-bg))]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl lg:text-5xl text-[hsl(var(--desktop-fg))] mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-lg text-[hsl(var(--desktop-muted-fg))] max-w-2xl mx-auto">
            Plataforma completa para cuidar da sua saúde mental enquanto vive sua paixão pelo futebol
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <Link
                key={service.title}
                to={service.link}
                className="group bg-[hsl(var(--desktop-card))] rounded-2xl p-8 border border-[hsl(var(--desktop-border))] hover:border-[hsl(var(--desktop-primary))]/30 hover:shadow-xl transition-all duration-300"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `hsl(${service.color} / 0.1)` }}
                >
                  <IconComponent 
                    className="w-7 h-7" 
                    style={{ color: `hsl(${service.color})` }}
                  />
                </div>
                
                <h3 className="font-semibold text-xl text-[hsl(var(--desktop-fg))] mb-3">
                  {service.title}
                </h3>
                
                <p className="text-[hsl(var(--desktop-muted-fg))] leading-relaxed">
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DesktopServices;
