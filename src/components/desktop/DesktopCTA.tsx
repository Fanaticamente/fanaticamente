import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const DesktopCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-[hsl(var(--desktop-primary))] to-[hsl(262,83%,48%)]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-display text-4xl lg:text-6xl text-[hsl(var(--desktop-primary-foreground))] mb-6">
          Pronto para cuidar da sua mente?
        </h2>
        <p className="text-xl text-[hsl(var(--desktop-primary-foreground))]/80 mb-10 max-w-2xl mx-auto">
          Comece agora mesmo sua jornada de equilíbrio emocional. 
          Primeira sessão com 20% de desconto.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/auth">
            <Button 
              size="lg"
              className="bg-[hsl(var(--desktop-bg))] hover:bg-[hsl(var(--desktop-bg))]/90 text-[hsl(var(--desktop-primary))] rounded-full px-8 py-6 text-lg font-semibold gap-2"
            >
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/terapeutas">
            <Button 
              size="lg"
              variant="outline"
              className="border-[hsl(var(--desktop-primary-foreground))]/30 text-[hsl(var(--desktop-primary-foreground))] hover:bg-[hsl(var(--desktop-primary-foreground))]/10 rounded-full px-8 py-6 text-lg font-semibold"
            >
              Ver especialistas
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DesktopCTA;
