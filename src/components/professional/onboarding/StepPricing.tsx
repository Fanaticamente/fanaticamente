import { useState } from "react";
import { DollarSign, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { OnboardingData } from "./OnboardingWizard";

interface StepPricingProps {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
}

const StepPricing = ({ data, onUpdate }: StepPricingProps) => {
  const [socioInfoOpen, setSocioInfoOpen] = useState(false);
  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors";

  return (
    <div>
      <div className="text-center mb-6">
        <DollarSign className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Valor & Preferências</h3>
        <p className="text-sm text-muted-foreground mt-1">Defina o valor e a duração das suas sessões</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">Duração</label>
            <select
              value={data.sessionDuration}
              onChange={(e) => onUpdate({ sessionDuration: e.target.value })}
              className={inputClassName}
            >
              <option value="30">30 min</option>
              <option value="50">50 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">Valor (R$)</label>
            <input
              type="number"
              value={data.sessionPrice}
              onChange={(e) => onUpdate({ sessionPrice: e.target.value })}
              className={inputClassName}
              placeholder="150"
              min="0"
              step="10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showPrice"
            checked={data.showPrice}
            onChange={(e) => onUpdate({ showPrice: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-emerald-500"
          />
          <label htmlFor="showPrice" className="text-card-foreground text-sm">
            Exibir valor no meu card
          </label>
        </div>

        {/* Sócio Consciente */}
        <div className="border border-therapy/30 rounded-xl p-4 bg-therapy/5">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="socioConsciente"
              checked={data.socioConsciente}
              onChange={(e) => onUpdate({ socioConsciente: e.target.checked })}
              className="w-5 h-5 rounded border-border accent-emerald-500 mt-0.5"
            />
            <div>
              <label htmlFor="socioConsciente" className="text-card-foreground text-sm font-semibold block">
                ⚽ Programa Sócio Consciente
              </label>
              <p className="text-muted-foreground text-xs mt-1">
                Redução de 20% para sócios-torcedores como incentivo ao cuidado com a saúde mental.
              </p>
              <button
                type="button"
                onClick={() => setSocioInfoOpen(true)}
                className="text-xs font-medium mt-2 flex items-center gap-1 hover:underline"
                style={{ color: "#3b82f6" }}
              >
                <Info className="w-3.5 h-3.5" />
                Saiba mais
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={socioInfoOpen} onOpenChange={setSocioInfoOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800 flex items-center gap-2">
              ⚽ Programa Sócio Consciente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>O Sócio Consciente é um programa criado para ampliar e incentivar o acesso de sócios-torcedores dos clubes ao cuidado com a saúde mental.</p>
            <p>Ao optar por atender pelo programa, você mantém integralmente sua autonomia profissional. A adesão consiste em conceder uma redução de 20% sobre o valor habitualmente praticado.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepPricing;
