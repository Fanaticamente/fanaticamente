import { Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

const FanatiClassCard = () => {
  const { data: moduleConfig } = useModuleConfig('fanaticlass_card');
  
  const config = moduleConfig?.config || {};
  const title = (config.title as string) || "FanatiClass";
  const link = (config.link as string) || "/cursos";

  return (
    <Link
      to={link}
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted p-6 group border border-border"
    >
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
          Novo
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
          <Play className="w-8 h-8 text-secondary fill-secondary" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-3xl text-card-foreground mb-1">
            Fanati<span className="text-primary">Class</span>
          </h3>
          <p className="text-muted-foreground text-sm">
            Cursos online para desenvolver sua inteligência emocional
          </p>
        </div>

        <ChevronRight className="w-8 h-8 text-primary group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mt-4 flex gap-2">
        <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
          Gratuitos
        </span>
        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
          Premium
        </span>
      </div>
    </Link>
  );
};

export default FanatiClassCard;
