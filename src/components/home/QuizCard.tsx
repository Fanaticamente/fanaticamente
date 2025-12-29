import { MessageCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleConfig } from "@/hooks/useModuleConfig";

const QuizCard = () => {
  const { data: moduleConfig } = useModuleConfig('quiz_card');
  
  const config = moduleConfig?.config || {};
  const title = (config.title as string) || "Quiz";
  const link = (config.link as string) || "/quiz";

  return (
    <Link
      to={link}
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl bg-quiz p-6 group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center gap-4">
        <div className="flex -space-x-3">
          <div className="w-14 h-14 rounded-full bg-muted border-2 border-quiz flex items-center justify-center">
            <span className="text-2xl">👨</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-muted border-2 border-quiz flex items-center justify-center">
            <span className="text-2xl">👩</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-sm text-quiz-foreground/70 uppercase tracking-wide">
              Resenha
            </span>
          </div>
          <h3 className="font-display text-2xl text-quiz-foreground">
            Treine sua habilidade de{" "}
            <span className="text-primary">escutar</span> e se{" "}
            <span className="text-primary">comunicar!</span>
          </h3>
        </div>

        <ChevronRight className="w-8 h-8 text-primary group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default QuizCard;
