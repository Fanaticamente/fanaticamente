import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import resenhaLaEles from "@/assets/resenha-deles-v2.png.asset.json";
import resenhaLaElas from "@/assets/resenha-delas-v2.png.asset.json";
import resenhaBet from "@/assets/resenha-bet.png.asset.json";
import resenhaFanaticaLogo from "@/assets/resenha-fanatica-logo.png.asset.json";
import {
  RESENHA_QUESTIONS,
  RESENHA_TOPICS,
  questionsLudopatia,
  type ResenhaTopicKey,
} from "@/data/resenhaQuestions";
import {
  useQuizCategories,
  useQuizTopics,
  useQuizQuestions,
} from "@/hooks/useQuizContent";

interface Question {
  id: number;
  scenario: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

const CategoryButton = ({
  image,
  alt,
  onClick,
}: {
  image: string;
  alt: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="block relative w-full overflow-hidden rounded-2xl h-32 sm:h-40 group bg-slate-100 shadow-sm"
  >
    <img
      src={image}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
    {/* Tint the green banner background with the user's club color while
        preserving the illustration details (mix-blend-hue keeps saturation
        and luminosity from the image, replacing only the hue). */}
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ background: "var(--club-500)", mixBlendMode: "hue" }}
    />
    <div className="absolute right-4 top-1/2 -translate-y-1/2">
      <ChevronRight className="w-6 h-6 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);



const Quiz = () => {
  const [category, setCategory] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const { data: dbCategories } = useQuizCategories();
  const { data: dbTopics } = useQuizTopics();
  const { data: dbQuestions } = useQuizQuestions();

  const hasDbContent = !!dbCategories && dbCategories.length > 0;

  const categories = hasDbContent
    ? dbCategories!.filter((c) => c.is_visible)
    : [
        { id: "homens", key: "homens", label: "Resenha Deles", description: null, image_url: null, has_topics: true, order_index: 0, is_visible: true },
        { id: "mulheres", key: "mulheres", label: "Resenha Delas", description: null, image_url: null, has_topics: true, order_index: 1, is_visible: true },
        { id: "ludopatia", key: "ludopatia", label: "Bet vs Consequências", description: null, image_url: null, has_topics: false, order_index: 2, is_visible: true },
      ];

  const activeCategory = categories.find((c) => c.key === category) || null;
  const needsTopic = !!activeCategory?.has_topics;

  const topics = hasDbContent
    ? (dbTopics ?? [])
        .filter((t) => t.is_visible && t.category_id === activeCategory?.id)
        .map((t) => ({ id: t.id, key: t.key, label: t.label, description: t.description ?? "" }))
    : RESENHA_TOPICS.map((t) => ({ id: t.key, key: t.key, label: t.label, description: t.description }));

  const staticQuestions = () => {
    if (category === "ludopatia") return questionsLudopatia;
    if (needsTopic && topic)
      return RESENHA_QUESTIONS[category === "homens" ? "eles" : "elas"][topic as ResenhaTopicKey];
    return [];
  };

  const questions = hasDbContent
    ? (dbQuestions ?? []).filter(
        (q) =>
          q.is_visible &&
          q.category_id === activeCategory?.id &&
          (needsTopic ? q.topic_id === topic : true)
      )
    : staticQuestions();

  const quizStarted = !!activeCategory && (!needsTopic || !!topic);
  const question = questions[currentQuestion];

  const resetProgress = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  const backToTopics = () => {
    setTopic(null);
    resetProgress();
  };

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return;
    setSelectedOption(optionId);
    setShowFeedback(true);

    const option = question.options.find((o) => o.id === optionId);
    if (option?.isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setFinished(true);
      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from("quiz_completions").insert({
            user_id: user.id,
            quiz_key: category,
            score,
            total: questions.length,
          });
          if (!error) {
            toast.success("Atividade concluída! +1 ponto no ranking");
          }
        } catch {}
      })();
    }
  };

  const handleRestart = () => {
    setCategory(null);
    setTopic(null);
    resetProgress();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans normal-case">
      <Header title="Atividades" hideSearch />

      <main className="pt-[calc(56px+1cm)] px-4">
        {!category && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h1 className="font-sans text-2xl font-bold text-slate-900 mb-1" style={{ textTransform: "none" }}>
                Resenha Fanática
              </h1>
              <p className="text-sm text-slate-500">Escolha uma categoria para começar</p>
            </div>

            <div className="space-y-4">
              {categories.map((c) => (
                <CategoryButton
                  key={c.id}
                  image={
                    c.image_url ||
                    (c.key === "homens"
                      ? resenhaLaEles.url
                      : c.key === "mulheres"
                      ? resenhaLaElas.url
                      : resenhaBet.url)
                  }
                  alt={`${c.label}${c.description ? ` - ${c.description}` : ""}`}
                  onClick={() => { setCategory(c.key); setTopic(null); resetProgress(); }}
                />
              ))}
            </div>
          </div>
        )}

        {needsTopic && !topic && (
          <div className="animate-fade-in">
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 text-sm text-slate-500 mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="text-center mb-6">
              <h1
                className="font-sans text-2xl font-bold text-slate-900 mb-1"
                style={{ textTransform: "none" }}
              >
                {activeCategory?.label}
              </h1>
              <p className="text-sm text-slate-500">Escolha um tópico para começar</p>
            </div>

            <div className="space-y-3">
              {topics.map((t) => {
                const total = hasDbContent
                  ? (dbQuestions ?? []).filter((q) => q.is_visible && q.topic_id === t.id).length
                  : RESENHA_QUESTIONS[category === "homens" ? "eles" : "elas"][t.key as ResenhaTopicKey].length;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTopic(hasDbContent ? t.id : t.key); resetProgress(); }}
                    className="w-full flex items-center justify-between gap-3 text-left border border-slate-200 rounded-2xl p-4 bg-white shadow-sm transition-colors hover:border-[var(--club-500)]"
                  >
                    <span>
                      <span className="block font-semibold text-slate-900">{t.label}</span>
                      <span className="block text-xs text-slate-500">
                        {t.description} · {total} cenários
                      </span>
                    </span>
                    <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "var(--club-600)" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {quizStarted && !finished && question && (
          <div className="animate-fade-in">
            <button
              onClick={() => (needsTopic ? backToTopics() : handleRestart())}
              className="flex items-center gap-1 text-sm text-slate-500 mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            {/* Progress */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-slate-500 text-sm">
                {currentQuestion + 1}/{questions.length}
              </span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    background: "var(--club-600)",
                  }}
                />
              </div>
            </div>

            {/* Scenario */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6">
              <h2 className="font-sans text-lg font-semibold text-slate-900 mb-3" style={{ textTransform: "none" }}>
                Cenário
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {question.scenario}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const correctOption = question.options.find((o) => o.isCorrect);
                
                let borderClass = "border-slate-200 hover:border-[var(--club-500)]";
                let bgClass = "bg-white";
                
                if (showFeedback) {
                  if (option.isCorrect) {
                    borderClass = "border-green-600 border-2";
                    bgClass = "bg-green-50";
                  } else if (isSelected && !option.isCorrect) {
                    borderClass = "border-red-500 border-2";
                    bgClass = "bg-red-50";
                  }
                }

                return (
                  <div key={option.id}>
                    <button
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full text-left border rounded-xl p-4 transition-colors ${bgClass} ${borderClass}`}
                    >
                      <span className="text-slate-800">{option.text}</span>
                    </button>
                    
                    {/* Feedback below the selected option */}
                    {showFeedback && isSelected && (
                      <div className={`mt-2 p-3 rounded-lg animate-fade-in ${
                        option.isCorrect 
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}>
                        <p className={`text-sm ${option.isCorrect ? "text-green-700" : "text-red-700"}`}>
                          {option.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Button */}
            {showFeedback && (
              <button
                onClick={handleNext}
                className="w-full py-3 text-white rounded-xl font-semibold transition-colors"
                style={{ textTransform: "none", background: "var(--club-600)" }}
              >
                {currentQuestion < questions.length - 1 ? "Próxima" : "Ver Resultado"}
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="animate-fade-in text-center">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--club-50)" }}
            >
              <Trophy className="w-12 h-12" style={{ color: "var(--club-600)" }} />
            </div>

            <h1 className="font-sans text-3xl font-bold text-slate-900 mb-4" style={{ textTransform: "none" }}>
              Parabéns!
            </h1>

            <p className="text-slate-700 text-lg mb-2">
              Você acertou{" "}
              <span className="font-bold" style={{ color: "var(--club-600)" }}>{score}</span> de{" "}
              <span className="font-bold" style={{ color: "var(--club-600)" }}>{questions.length}</span>{" "}
              questões
            </p>

            <p className="text-slate-500 mb-8">
              Continue praticando para melhorar suas habilidades!
            </p>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 mx-auto py-3 px-8 text-white rounded-xl font-semibold transition-colors"
              style={{ textTransform: "none", background: "var(--club-600)" }}
            >
              <RotateCcw className="w-5 h-5" />
              Jogar novamente
            </button>
          </div>
        )}

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Quiz;
