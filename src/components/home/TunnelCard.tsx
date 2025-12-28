import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const TunnelCard = () => {
  return (
    <Link
      to="/terapeutas"
      className="block relative overflow-hidden rounded-2xl mx-4 my-4 h-40 group bg-gradient-to-r from-secondary via-secondary/80 to-secondary/60"
    >
      <div className="absolute inset-0 stadium-pattern" />
      
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div>
          <p className="text-primary font-display text-xl tracking-wider">
            TÚNEL DE ACESSO
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-card-foreground">
            Encontre um{" "}
            <span className="text-primary">Terapeuta</span>
          </h3>
        </div>

        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    </Link>
  );
};

export default TunnelCard;
