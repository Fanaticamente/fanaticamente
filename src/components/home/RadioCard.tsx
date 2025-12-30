import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

// Default background
import radioDefaultBg from "@/assets/hero-slide-3.jpg";

const RadioCard = () => {
  const { data: moduleConfig } = useModuleConfig('radio_card');
  
  const config = moduleConfig?.config || {};
  const title = (config.title as string) || "Rádio";
  const link = (config.link as string) || "/radio";
  const image = (config.image as string) || radioDefaultBg;

  return (
    <Link
      to={link}
      className="block mx-4 my-4 mb-24 relative overflow-hidden rounded-2xl h-40 group"
    >
      {/* Background image */}
      <img 
        src={image} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
        <ChevronRight className="w-5 h-5 text-primary-foreground" />
      </div>
    </Link>
  );
};

export default RadioCard;
