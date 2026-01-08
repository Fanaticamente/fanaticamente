import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RefundPixFormProps {
  appointmentId: string;
  appointmentStatus: string;
  rejectionReason?: string | null;
  professionalHourlyRate?: number | null;
  onPixSaved: () => void;
}

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" }
];

const RefundPixForm = ({ appointmentId, appointmentStatus, rejectionReason, professionalHourlyRate, onPixSaved }: RefundPixFormProps) => {
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePixKey = async () => {
    if (!pixKey.trim() || !pixKeyType) {
      toast.error("Preencha a chave PIX e o tipo");
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload: Record<string, any> = {
        user_pix_key: pixKey.trim(),
        user_pix_key_type: pixKeyType,
      };

      // When a rejection was stored as "cancelled", move it to the refund flow
      if (appointmentStatus === 'cancelled') {
        updatePayload.status = 'refund_pending';
      }

      const { error } = await supabase
        .from("appointments")
        .update(updatePayload)
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Chave PIX enviada! O profissional realizará o ressarcimento em até 48h.");
      onPixSaved();
    } catch (error) {
      console.error("Error saving PIX key:", error);
      toast.error("Erro ao salvar chave PIX");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <h4 className="font-medium text-orange-700 text-sm">Sessão Recusada pelo Profissional</h4>
          <p className="text-orange-600 text-xs mt-0.5">
            A sessão não pôde ser confirmada por motivo extraordinário.
          </p>
        </div>
      </div>

      {rejectionReason && (
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <p className="text-orange-700 text-xs">
            <span className="font-medium">Motivo:</span> {rejectionReason}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-card-foreground text-sm">
          Informe uma chave PIX registrada em seu nome para receber o ressarcimento
          {professionalHourlyRate && (
            <span className="font-semibold"> de R$ {professionalHourlyRate.toFixed(2).replace(".", ",")}</span>
          )}:
        </p>

        <select
          value={pixKeyType}
          onChange={(e) => setPixKeyType(e.target.value)}
          className="w-full h-11 px-3 bg-background border border-border rounded-xl text-card-foreground text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tipo da chave</option>
          {PIX_KEY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="Sua chave PIX"
          className="w-full h-11 px-3 bg-background border border-border rounded-xl text-card-foreground text-sm focus:border-primary focus:outline-none"
        />

        <button
          onClick={handleSavePixKey}
          disabled={isSaving || !pixKey.trim() || !pixKeyType}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Chave PIX para Ressarcimento"
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          O profissional tem até 48h para realizar o ressarcimento via PIX.
        </p>
      </div>
    </div>
  );
};

export default RefundPixForm;
