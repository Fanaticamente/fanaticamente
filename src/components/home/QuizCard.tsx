import { MessageCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const QuizCard = () => {
  return (
    <Link
      to="/quiz"
      className="block mx-4 my-4 relative overflow-hidden rounded-2xl bg-quiz p-6 group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center gap-4">
        <div className="flex -space-x-3">
          <div className="w-12 h-12 rounded-full bg-muted border-2 border-quiz flex items-center justify-center">
            <span className="text-xl">😎</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-muted border-2 border-quiz flex items-center justify-center">
            <span className="text-xl">🙂</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-xs text-quiz-foreground/70 uppercase tracking-wide">
              Resenha
            </span>
          </div>
          <h3 className="font-display text-xl text-quiz-foreground leading-tight">
            Treine sua habilidade de{" "}
            <span className="text-primary">escutar</span> e se{" "}
            <span className="text-primary">comunicar!</span>
          </h3>
        </div>

        <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default QuizCard;
