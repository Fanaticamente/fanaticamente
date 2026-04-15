import { useState, useRef } from "react";
import { Tags, X } from "lucide-react";
import { toast } from "sonner";

const SPECIALTY_OPTIONS = [
  "Ansiedade", "Depressão", "Terapia de Casais", "Relacionamentos",
  "Estresse", "Traumas", "Burnout", "Autoestima", "Luto", "Fobias",
  "TOC", "TDAH", "Psicologia Esportiva", "Saúde Mental no Esporte",
  "Performance", "Desenvolvimento Pessoal", "Conflitos Familiares",
  "Transtornos Alimentares",
];

interface StepSpecialtiesProps {
  specialties: string[];
  onUpdate: (specialties: string[]) => void;
}

const StepSpecialties = ({ specialties, onUpdate }: StepSpecialtiesProps) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (s: string) => {
    if (specialties.length >= 6) { toast.error("Máximo de 6 especialidades"); return; }
    const trimmed = s.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      onUpdate([...specialties, trimmed]);
    }
  };

  const remove = (s: string) => onUpdate(specialties.filter(x => x !== s));

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed) { toast.error("Digite a especialidade"); return; }
    if (trimmed.length > 30) { toast.error("Máximo 30 caracteres"); return; }
    add(trimmed);
    setCustomValue("");
    setIsAddingCustom(false);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <Tags className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Especialidades</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione até 6 áreas de atuação
        </p>
      </div>

      {/* Selected */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.map((s) => (
            <span key={s} className="px-3 py-1 bg-therapy/20 text-therapy text-sm rounded-full flex items-center gap-1">
              {s}
              <button type="button" onClick={() => remove(s)} className="hover:bg-therapy/30 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom input */}
      {isAddingCustom && (
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } else if (e.key === "Escape") { setIsAddingCustom(false); setCustomValue(""); } }}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-card-foreground text-sm focus:border-therapy focus:outline-none"
            placeholder="Digite sua especialidade..."
            maxLength={30}
            autoFocus
          />
          <button type="button" onClick={addCustom} className="px-3 py-2 bg-therapy text-white text-sm rounded-lg">Adicionar</button>
          <button type="button" onClick={() => { setIsAddingCustom(false); setCustomValue(""); }} className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancelar</button>
        </div>
      )}

      {/* Options grid */}
      <div className="flex flex-wrap gap-2">
        {SPECIALTY_OPTIONS.filter(s => !specialties.includes(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            disabled={specialties.length >= 6}
            className="px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded-full hover:bg-therapy/20 hover:text-therapy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + {s}
          </button>
        ))}
        {!isAddingCustom && specialties.length < 6 && (
          <button
            type="button"
            onClick={() => { setIsAddingCustom(true); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="px-3 py-1.5 bg-therapy/10 text-therapy text-sm rounded-full hover:bg-therapy/20 transition-colors border border-therapy/30"
          >
            + Outro
          </button>
        )}
      </div>
    </div>
  );
};

export default StepSpecialties;
