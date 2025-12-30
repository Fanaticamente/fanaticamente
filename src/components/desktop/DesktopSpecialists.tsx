import { Star } from "lucide-react";
import therapist1 from "@/assets/therapist-1.jpg";
import therapist2 from "@/assets/therapist-2.jpg";
import therapist3 from "@/assets/therapist-3.jpg";

const specialists = [
  {
    name: "Dra. Carla Mendes",
    specialty: "Ansiedade esportiva",
    rating: 4.9,
    reviews: 124,
    image: therapist1,
    available: true,
  },
  {
    name: "Dr. Roberto Silva",
    specialty: "Psicologia do esporte",
    rating: 4.8,
    reviews: 98,
    image: therapist2,
    available: true,
  },
  {
    name: "Dra. Amanda Costa",
    specialty: "Gestão emocional",
    rating: 5.0,
    reviews: 156,
    image: therapist3,
    available: false,
  },
];

const DesktopSpecialists = () => {
  return (
    <section className="py-24 bg-[hsl(var(--desktop-muted))]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-4xl lg:text-5xl text-[hsl(var(--desktop-fg))] mb-4">
              Nossos Especialistas
            </h2>
            <p className="text-lg text-[hsl(var(--desktop-muted-fg))]">
              Psicólogos que entendem a paixão pelo futebol
            </p>
          </div>
          <a 
            href="/terapeutas" 
            className="text-[hsl(var(--desktop-primary))] font-medium hover:underline hidden lg:block"
          >
            Ver todos →
          </a>
        </div>

        {/* Specialists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specialists.map((specialist) => (
            <div
              key={specialist.name}
              className="bg-[hsl(var(--desktop-card))] rounded-2xl overflow-hidden border border-[hsl(var(--desktop-border))] hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="relative h-64">
                <img 
                  src={specialist.image} 
                  alt={specialist.name}
                  className="w-full h-full object-cover"
                />
                {specialist.available && (
                  <span className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Disponível
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-semibold text-xl text-[hsl(var(--desktop-fg))] mb-1">
                  {specialist.name}
                </h3>
                <p className="text-[hsl(var(--desktop-muted-fg))] mb-4">
                  {specialist.specialty}
                </p>

                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-[hsl(var(--desktop-fg))]">{specialist.rating}</span>
                  <span className="text-[hsl(var(--desktop-muted-fg))] text-sm">
                    ({specialist.reviews} avaliações)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesktopSpecialists;
