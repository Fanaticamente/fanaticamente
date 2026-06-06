import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "meus-cursos-info-dismissed";

const MeusCursosInfoCard = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-sans font-bold text-gray-800 mb-3">
          Como funciona o Nível de Consciência?
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Sua evolução nos cursos da <strong>FanatiClass</strong> gera pontos
          que aumentam o seu Nível de Consciência:
        </p>

        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5 text-emerald-600">•</span>
            <span>
              <strong>Aula concluída</strong> — vale <strong>10 pontos</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5 text-emerald-600">•</span>
            <span>
              <strong>Curso finalizado</strong> — vale <strong>100 pontos</strong>.
            </span>
          </li>
        </ul>

        <p className="text-sm text-gray-600 leading-relaxed mb-2 font-semibold">
          Níveis de consciência:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-6">
          <li>• <strong>Amador</strong> — a partir de 0 pts</li>
          <li>• <strong>Base</strong> — a partir de 80 pts</li>
          <li>• <strong>Profissional</strong> — a partir de 250 pts</li>
          <li>• <strong>Craque</strong> — a partir de 600 pts</li>
          <li>• <strong>Lendário</strong> — a partir de 1500 pts</li>
        </ul>

        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-full text-white text-sm font-semibold transition-colors bg-emerald-600 hover:bg-emerald-700"
        >
          Não ver esta mensagem novamente
        </button>
      </div>
    </div>
  );
};

export default MeusCursosInfoCard;