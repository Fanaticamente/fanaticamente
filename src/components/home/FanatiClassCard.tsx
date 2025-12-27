import { Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const FanatiClassCard = () => {
  return (
    <Link
      to="/cursos"
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted p-5 group border border-border"
    >
      <div className="absolute top-3 right-3">
        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded uppercase">
          Novo
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
          <Play className="w-7 h-7 text-secondary fill-secondary" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-2xl text-card-foreground mb-0.5">
            Fanati<span className="text-primary">Class</span>
          </h3>
          <p className="text-muted-foreground text-xs">
            Cursos online para desenvolver sua inteligência emocional
          </p>
        </div>

        <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mt-3 flex gap-2">
        <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[10px] rounded">
          Gratuitos
        </span>
        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded">
          Premium
        </span>
      </div>
    </Link>
  );
};

export default FanatiClassCard;
