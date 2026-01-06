import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { useState, useEffect } from "react";

const RadioCard = () => {
  const moduleQuery = useModuleConfig('radio_card');
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const config = moduleQuery.data?.config || {};
  const link = (config.link as string) || "/radio";
  const image = config.image as string | undefined;

  // Reset imageLoaded when image URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [image]);

  return (
    <Link
      to={link}
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl h-40 group bg-muted"
    >
      {image && (
        <img 
          src={image} 
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          onLoad={() => setImageLoaded(true)}
        />
      )}

      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
        <ChevronRight className="w-5 h-5 text-primary-foreground" />
      </div>
    </Link>
  );
};

export default RadioCard;
