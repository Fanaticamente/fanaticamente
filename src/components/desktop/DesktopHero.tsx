import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroSlide1 from "@/assets/hero-slide-1.jpg";

const DesktopHero = () => {
  return (
    <section className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-[hsl(var(--desktop-muted))] to-[hsl(var(--desktop-bg))] flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text Content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--desktop-primary))]/10 text-[hsl(var(--desktop-primary))] px-4 py-2 rounded-full text-sm font-medium">
            🧠 Saúde mental para torcedores
          </div>
          
          <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl text-[hsl(var(--desktop-fg))] leading-tight">
            Cuide da sua mente,<br />
            <span className="text-[hsl(var(--desktop-primary))]">viva o futebol</span>
            <br />com equilíbrio.
          </h1>
          
          <p className="text-lg text-[hsl(var(--desktop-muted-fg))] max-w-lg">
            Conectamos você aos melhores psicólogos especializados em torcedores. 
            Sessões online, no seu tempo, do seu jeito.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/terapeutas">
              <Button 
                size="lg"
                className="bg-[hsl(var(--desktop-primary))] hover:bg-[hsl(var(--desktop-primary))]/90 text-[hsl(var(--desktop-primary-foreground))] rounded-full px-8 py-6 text-lg font-semibold gap-2"
              >
                Encontrar especialista
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/cursos">
              <Button 
                size="lg"
                variant="outline"
                className="border-[hsl(var(--desktop-border))] text-[hsl(var(--desktop-fg))] hover:bg-[hsl(var(--desktop-muted))] rounded-full px-8 py-6 text-lg font-semibold"
              >
                Conhecer cursos
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-12 pt-8 border-t border-[hsl(var(--desktop-border))]">
            <div>
              <p className="font-display text-3xl text-[hsl(var(--desktop-fg))]">500+</p>
              <p className="text-sm text-[hsl(var(--desktop-muted-fg))]">Psicólogos</p>
            </div>
            <div>
              <p className="font-display text-3xl text-[hsl(var(--desktop-fg))]">10mil+</p>
              <p className="text-sm text-[hsl(var(--desktop-muted-fg))]">Sessões realizadas</p>
            </div>
            <div>
              <p className="font-display text-3xl text-[hsl(var(--desktop-fg))]">4.9★</p>
              <p className="text-sm text-[hsl(var(--desktop-muted-fg))]">Avaliação média</p>
            </div>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="relative hidden lg:block">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={heroSlide1} 
              alt="Torcedor em equilíbrio" 
              className="w-full h-[600px] object-cover"
            />
            {/* Floating Card */}
            <div className="absolute bottom-8 left-8 right-8 bg-[hsl(var(--desktop-card))]/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--desktop-primary))] flex items-center justify-center text-[hsl(var(--desktop-primary-foreground))] font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-[hsl(var(--desktop-fg))]">Próxima sessão disponível</p>
                  <p className="text-sm text-[hsl(var(--desktop-muted-fg))]">Agende agora mesmo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopHero;
