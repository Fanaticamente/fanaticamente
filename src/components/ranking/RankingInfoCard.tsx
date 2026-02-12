import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "ranking-info-dismissed";

const RankingInfoCard = () => {
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
          Como funciona o Ranking?
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          O <strong>Brasileirão da Saúde Mental</strong> pontua os clubes com
          base nas ações dos seus torcedores. Cada atividade gera pontos
          para o clube do coração do torcedor conforme abaixo:
        </p>

        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5" style={{ color: '#0066ff' }}>•</span>
            <span>
              <strong>Sessão de terapia</strong> — cada consulta concluída com
              um profissional da plataforma vale <strong>3 pontos</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5" style={{ color: '#0066ff' }}>•</span>
            <span>
               <strong>Termômetro Torcedor</strong> — cada preenchimento diário
               do Termômetro Torcedor vale <strong>1 ponto</strong>.
             </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5" style={{ color: '#0066ff' }}>•</span>
            <span>
              <strong>FanatiClass</strong> — cada curso assistido ou finalizado
              na plataforma vale <strong>1 ponto</strong>.
            </span>
          </li>
        </ul>

        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-full text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#0066ff' }}
        >
          Não ver esta mensagem novamente
        </button>
      </div>
    </div>
  );
};

export default RankingInfoCard;
