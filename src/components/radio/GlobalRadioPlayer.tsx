import { Radio as RadioIcon, Pause, Loader2 } from "lucide-react";
import { useRadio } from "@/contexts/RadioContext";
import { useLocation } from "react-router-dom";

const GlobalRadioPlayer = () => {
  const { playingStation, isLoading, stop } = useRadio();
  const location = useLocation();

  // Don't render on the radio page itself (it has its own inline player bar)
  if (!playingStation || location.pathname === "/radio") return null;

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+56px)] left-0 right-0 z-40 bg-radio p-3 flex items-center gap-4 md:hidden">
      <div className="w-10 h-10 rounded-full bg-radio-foreground/20 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-radio-foreground animate-spin" />
        ) : (
          <RadioIcon className="w-5 h-5 text-radio-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-radio-foreground font-medium text-sm truncate">
          {playingStation.name}
        </p>
        <p className="text-radio-foreground/70 text-xs">
          {playingStation.frequency} • {isLoading ? "Conectando..." : "Ao vivo"}
        </p>
      </div>
      <button
        onClick={stop}
        className="w-9 h-9 rounded-full bg-radio-foreground/20 flex items-center justify-center flex-shrink-0"
      >
        <Pause className="w-4 h-4 text-radio-foreground" />
      </button>
    </div>
  );
};

export default GlobalRadioPlayer;
