import { AlignLeft } from "lucide-react";

interface StepBioProps {
  bio: string;
  onUpdate: (bio: string) => void;
}

const StepBio = ({ bio, onUpdate }: StepBioProps) => {
  return (
    <div>
      <div className="text-center mb-6">
        <AlignLeft className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Sua Apresentação</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Conte sobre você e sua abordagem terapêutica
        </p>
      </div>

      <textarea
        value={bio}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors min-h-[180px] resize-none"
        placeholder="Ex: Sou psicóloga clínica com abordagem cognitivo-comportamental, especializada em ansiedade e estresse. Acredito que o autoconhecimento é a chave para uma vida mais equilibrada..."
        maxLength={500}
      />
      <div className="flex justify-between mt-1">
        <p className={`text-xs ${bio.length < 50 ? "text-red-400" : "text-muted-foreground"}`}>
          Mínimo 50 caracteres
        </p>
        <p className="text-xs text-muted-foreground">{bio.length}/500</p>
      </div>
    </div>
  );
};

export default StepBio;
