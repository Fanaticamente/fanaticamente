import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { useState, useEffect } from "react";

const QuizCard = () => {
  const { data: moduleConfig, isLoading } = useModuleConfig('quiz_card');
  const [isReady, setIsReady] = useState(false);
  
  const config = moduleConfig?.config || {};
  const link = (config.link as string) || "/quiz";
  const image = config.image as string | undefined;

  // Pre-load image from database before showing
  useEffect(() => {
    if (isLoading) return;
    
    if (!image) {
      setIsReady(false);
      return;
    }

    const img = new Image();
    img.onload = () => setIsReady(true);
    img.onerror = () => setIsReady(false);
    img.src = image;
  }, [image, isLoading]);

  // Show placeholder while loading
  if (isLoading || !isReady || !image) {
    return (
      <div className="block mx-4 my-4 relative overflow-hidden rounded-2xl h-40 bg-muted animate-pulse" />
    );
  }

  return (
    <Link
      to={link}
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl h-40 group"
    >
      <img 
        src={image} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
        <ChevronRight className="w-5 h-5 text-primary-foreground" />
      </div>
    </Link>
  );
};

export default QuizCard;
