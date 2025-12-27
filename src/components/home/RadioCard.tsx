import { Radio, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const RadioCard = () => {
  return (
    <Link
      to="/radio"
      className="block mx-4 my-4 mb-20 relative overflow-hidden rounded-2xl bg-gradient-to-r from-radio to-radio/80 p-5 group"
    >
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <Radio className="w-28 h-28" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-card/20 flex items-center justify-center animate-pulse">
          <Radio className="w-7 h-7 text-radio-foreground" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-2xl text-radio-foreground mb-0.5">
            Alambrado <span className="text-primary">FM</span>
          </h3>
          <p className="text-radio-foreground/80 text-xs">
            As principais rádios esportivas do Brasil
          </p>
        </div>

        <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-radio-foreground/70 text-xs">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span>27 estados • Ao vivo</span>
      </div>
    </Link>
  );
};

export default RadioCard;
