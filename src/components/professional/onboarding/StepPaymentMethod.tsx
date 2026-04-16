import { QrCode, Info } from "lucide-react";

interface StepPaymentMethodProps {
  professionalId: string;
  pixKey: string;
  onUpdate: (pixKey: string) => void;
}

const StepPaymentMethod = ({ professionalId, pixKey, onUpdate }: StepPaymentMethodProps) => {
  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors";

  return (
    <div>
      <div className="text-center mb-6">
        <QrCode className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Método de Recebimento</h3>
        <p className="text-sm text-muted-foreground mt-1">Configure como você receberá os pagamentos das sessões</p>
      </div>

      <div className="space-y-4">
        <div className="border border-therapy/30 rounded-xl p-4 bg-therapy/5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-5 h-5 text-therapy" />
            <h4 className="text-card-foreground font-semibold">Chave PIX Aleatória</h4>
          </div>
          <p className="text-muted-foreground text-xs mb-4">
            Informe sua chave PIX aleatória para receber pagamentos diretamente na sua conta. Por segurança, aceitamos apenas chaves aleatórias.
          </p>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => onUpdate(e.target.value)}
            className={inputClassName}
            placeholder="Cole aqui sua chave PIX aleatória"
          />
        </div>

        <div className="bg-muted/30 rounded-xl p-3 border border-border">
          <p className="text-muted-foreground text-xs flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Os clientes realizarão o pagamento via PIX diretamente para você ao agendar sessões. O valor integral é transferido sem taxas da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepPaymentMethod;
