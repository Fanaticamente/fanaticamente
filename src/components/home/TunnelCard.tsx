import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

// Default background image
import tunnelDefaultBg from "@/assets/hero-slide-1.jpg";

const TunnelCard = () => {
  const { data: moduleConfig } = useModuleConfig('tunnel_access');
  
  const config = moduleConfig?.config || {};
  const title = (config.title as string) || "Encontre um Terapeuta";
  const link = (config.link as string) || "/terapeutas";
  const image = (config.image as string) || tunnelDefaultBg;

  return (
    <Link
      to={link}
      className="block relative overflow-hidden rounded-2xl mx-4 my-4 h-40 group"
    >
      {/* Background image - always show */}
      <img 
        src={image} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      
      {/* Arrow button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
        <ChevronRight className="w-6 h-6 text-primary-foreground" />
      </div>
    </Link>
  );
};

export default TunnelCard;
