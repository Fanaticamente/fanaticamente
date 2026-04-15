import { useState, useEffect } from "react";
import { Home, Thermometer, Trophy, Newspaper } from "lucide-react";

const STORAGE_KEY = "bottomnav-onboarding-done";

const steps = [
  {
    icon: Home,
    label: "Início",
    description: "Sua tela principal com acesso rápido a tudo: especialistas, cursos, rádio e muito mais.",
    position: 0,
  },
  {
    icon: Thermometer,
    label: "Termômetro",
    description: "Registre como você está se sentindo hoje. Acompanhe suas emoções ao longo do tempo.",
    position: 1,
  },
  {
    icon: Trophy,
    label: "Ranking",
    description: "Veja o Brasileirão da Saúde Mental! Cada ação sua pontua para o clube do seu coração.",
    position: 2,
  },
  {
    icon: Newspaper,
    label: "Futebol",
    description: "Notícias do mundo do futebol reescritas com foco em saúde mental do torcedor.",
    position: 3,
  },
];

const BottomNavOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setCurrentStep(0), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep === null) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "true");
      setCurrentStep(null);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setCurrentStep(null);
  };

  if (currentStep === null) return null;

  const step = steps[currentStep];
  const IconComponent = step.icon;

  // Calculate horizontal position for the tooltip arrow
  // 4 items equally spaced: positions at 12.5%, 37.5%, 62.5%, 87.5%
  const arrowLeftPercent = 12.5 + step.position * 25;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Tooltip balloon */}
      <div
        className="fixed z-[61] left-4 right-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-2xl p-5">
          {/* Arrow pointing down */}
          <div
            className="absolute -bottom-2 w-4 h-4 bg-white rotate-45 rounded-sm"
            style={{ left: `${arrowLeftPercent}%`, transform: "translateX(-50%) rotate(45deg)" }}
          />

          {/* Content */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base">{step.label}</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            {/* Step indicator */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pular
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                {currentStep < steps.length - 1 ? "Próximo" : "Entendi!"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNavOnboarding;
