import { Radio, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ModuleConfig } from "@/hooks/useAppModules";

interface RadioCardProps {
  config?: ModuleConfig;
}

const RadioCard = ({ config }: RadioCardProps) => {
  const title = config?.title || "Alambrado FM";
  const subtitle = config?.subtitle || "As principais rádios esportivas do Brasil";
  const link = config?.link || "/radio";

  return (
    <Link
      to={link}
      className="block mx-4 my-4 mb-24 relative overflow-hidden rounded-2xl bg-gradient-to-r from-radio to-radio/80 p-6 group"
    >
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <Radio className="w-32 h-32" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-card/20 flex items-center justify-center animate-pulse">
          <Radio className="w-8 h-8 text-radio-foreground" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-3xl text-radio-foreground mb-1">
            {title.includes("Alambrado") ? (
              <>Alambrado <span className="text-primary">FM</span></>
            ) : (
              title
            )}
          </h3>
          <p className="text-radio-foreground/80 text-sm">
            {subtitle}
          </p>
        </div>

        <ChevronRight className="w-8 h-8 text-primary group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mt-4 flex items-center gap-2 text-radio-foreground/70 text-sm">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span>27 estados • Ao vivo</span>
      </div>
    </Link>
  );
};

export default RadioCard;
