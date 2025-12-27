import { useState } from "react";
import { MessageCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

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

const questionsHomens: Question[] = [
  {
    id: 1,
    scenario: "Seu amigo está chateado porque o time dele perdeu uma final importante. Ele diz: 'Não aguento mais, sempre a mesma coisa!'",
    options: [
      { id: "a", text: "Relaxa, é só um jogo!", isCorrect: false, feedback: "Minimizar os sentimentos dele pode fazê-lo se sentir incompreendido." },
      { id: "b", text: "Cara, eu entendo. Perder dói mesmo. Quer falar sobre isso?", isCorrect: true, feedback: "Validar os sentimentos e oferecer escuta é a melhor abordagem." },
      { id: "c", text: "O time do meu vizinho também perdeu, nem ligo.", isCorrect: false, feedback: "Mudar de assunto não ajuda seu amigo a processar os sentimentos." },
      { id: "d", text: "Pelo menos vocês chegaram na final!", isCorrect: false, feedback: "Tentar ver o lado positivo pode parecer que você não entende a dor dele." },
    ],
  },
  {
    id: 2,
    scenario: "Durante o jogo, você percebe que está ficando muito estressado e ansioso. Seu coração está acelerado.",
    options: [
      { id: "a", text: "Ignoro e continuo assistindo normalmente.", isCorrect: false, feedback: "Ignorar sinais de ansiedade pode piorar a situação." },
      { id: "b", text: "Respiro fundo algumas vezes e tento relaxar os ombros.", isCorrect: true, feedback: "Técnicas de respiração ajudam a regular o sistema nervoso." },
      { id: "c", text: "Tomo mais uma cerveja para relaxar.", isCorrect: false, feedback: "Álcool pode intensificar a ansiedade a longo prazo." },
      { id: "d", text: "Desligo a TV e vou fazer outra coisa.", isCorrect: false, feedback: "Evitar completamente pode ser uma estratégia válida, mas não resolve a raiz." },
    ],
  },
];

const questionsMulheres: Question[] = [
  {
    id: 1,
    scenario: "Sua amiga está frustrada porque não consegue acompanhar os jogos com o namorado. Ela diz: 'Ele só fala de futebol, me sinto excluída.'",
    options: [
      { id: "a", text: "Termina com ele então!", isCorrect: false, feedback: "Sugerir término imediato não ajuda a resolver o problema de comunicação." },
      { id: "b", text: "Entendo como você se sente. Já tentou conversar com ele sobre isso?", isCorrect: true, feedback: "Validar sentimentos e sugerir comunicação é o melhor caminho." },
      { id: "c", text: "Futebol é chato mesmo.", isCorrect: false, feedback: "Concordar com a crítica não resolve o problema do relacionamento." },
      { id: "d", text: "Você devia aprender sobre futebol para acompanhar.", isCorrect: false, feedback: "Colocar a responsabilidade só nela não é justo." },
    ],
  },
];

const Quiz = () => {
  const [category, setCategory] = useState<"homens" | "mulheres" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = category === "homens" ? questionsHomens : questionsMulheres;
  const question = questions[currentQuestion];

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
    }
  };

  const handleRestart = () => {
    setCategory(null);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24 px-4">
        {!category && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quiz/20 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-quiz" />
              </div>
              <h1 className="font-display text-4xl text-primary mb-2">
                Resenha Fanática
              </h1>
              <p className="text-muted-foreground">
                Treine suas habilidades de escuta e comunicação
              </p>
            </div>

            <p className="text-card-foreground text-center mb-8">
              Escolha uma categoria para começar:
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setCategory("homens")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👨</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-card-foreground group-hover:text-primary transition-colors">
                      Papo de Arquibancada
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Cenários focados em comunicação masculina
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </button>

              <button
                onClick={() => setCategory("mulheres")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👩</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-card-foreground group-hover:text-primary transition-colors">
                      Torcida Delas
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Cenários focados em comunicação feminina
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </button>
            </div>
          </div>
        )}

        {category && !finished && question && (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-muted-foreground text-sm">
                {currentQuestion + 1}/{questions.length}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Scenario */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-display text-xl text-card-foreground mb-4">
                Cenário
              </h2>
              <p className="text-card-foreground leading-relaxed">
                {question.scenario}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const correctOption = question.options.find((o) => o.isCorrect);
                
                let borderClass = "border-border hover:border-primary";
                let bgClass = "bg-card";
                
                if (showFeedback) {
                  if (option.isCorrect) {
                    // Always show correct answer in green when feedback is shown
                    borderClass = "border-secondary border-2";
                    bgClass = "bg-secondary/20";
                  } else if (isSelected && !option.isCorrect) {
                    // Show selected wrong answer in red
                    borderClass = "border-destructive border-2";
                    bgClass = "bg-destructive/20";
                  }
                }

                return (
                  <div key={option.id}>
                    <button
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full text-left border rounded-xl p-4 transition-colors ${bgClass} ${borderClass}`}
                    >
                      <span className="text-card-foreground">{option.text}</span>
                    </button>
                    
                    {/* Feedback below the selected option */}
                    {showFeedback && isSelected && (
                      <div className={`mt-2 p-3 rounded-lg animate-fade-in ${
                        option.isCorrect 
                          ? "bg-secondary/10 border border-secondary/30" 
                          : "bg-destructive/10 border border-destructive/30"
                      }`}>
                        <p className={`text-sm ${option.isCorrect ? "text-secondary" : "text-destructive"}`}>
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
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
              >
                {currentQuestion < questions.length - 1 ? "Próxima" : "Ver Resultado"}
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>

            <h1 className="font-display text-4xl text-primary mb-4">
              Parabéns!
            </h1>

            <p className="text-card-foreground text-xl mb-2">
              Você acertou{" "}
              <span className="text-primary font-bold">{score}</span> de{" "}
              <span className="text-primary font-bold">{questions.length}</span>{" "}
              questões
            </p>

            <p className="text-muted-foreground mb-8">
              Continue praticando para melhorar suas habilidades!
            </p>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 mx-auto py-4 px-8 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
              Jogar Novamente
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Quiz;
