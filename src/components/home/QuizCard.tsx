import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

// Default background
import quizDefaultBg from "@/assets/hero-slide-2.jpg";

const QuizCard = () => {
  const { data: moduleConfig } = useModuleConfig('quiz_card');
  
  const config = moduleConfig?.config || {};
  const title = (config.title as string) || "Quiz";
  const link = (config.link as string) || "/quiz";
  const image = (config.image as string) || quizDefaultBg;

  return (
    <Link
      to={link}
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl h-24 group"
    >
      {/* Background image */}
      <img 
        src={image} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />

      {/* Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
        <ChevronRight className="w-5 h-5 text-primary-foreground" />
      </div>
    </Link>
  );
};

export default QuizCard;
