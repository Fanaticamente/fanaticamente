import { useState } from "react";
import { X, AlertTriangle, Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addHours } from "date-fns";

interface RejectAppointmentDialogProps {
  appointment: {
    id: string;
    profiles?: {
      full_name: string | null;
    } | null;
  };
  onClose: () => void;
  onRejected: () => void;
}

// Motivos que exigem reembolso ao usuário
const REFUND_REASONS = [
  { value: "imprevisto", label: "Imprevisto" },
  { value: "problemas_pessoais", label: "Problemas pessoais" },
  { value: "outro", label: "Outro" },
];

// Motivos relacionados a pagamento (não exigem reembolso)
const PAYMENT_REASONS = [
  { value: "pagamento_nao_realizado", label: "Pagamento não realizado" },
  { value: "comprovante_invalido", label: "Comprovante inválido" },
];

const RejectAppointmentDialog = ({ appointment, onClose, onRejected }: RejectAppointmentDialogProps) => {
  const [step, setStep] = useState<"confirm" | "reason">("confirm");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRefundReason = REFUND_REASONS.some(r => r.value === selectedReason);
  const isPaymentReason = PAYMENT_REASONS.some(r => r.value === selectedReason);

  const handleConfirmReject = () => {
    setStep("reason");
  };

  const getReasonLabel = () => {
    if (selectedReason === "outro") return customReason;
    const allReasons = [...REFUND_REASONS, ...PAYMENT_REASONS];
    return allReasons.find(r => r.value === selectedReason)?.label || "";
  };

  const handleSubmitRejection = async () => {
    if (!selectedReason) {
      toast.error("Selecione um motivo para a recusa");
      return;
    }

    const finalReason = getReasonLabel();

    if (selectedReason === "outro" && !customReason.trim()) {
      toast.error("Informe o motivo da recusa");
      return;
    }

    setIsSubmitting(true);
    try {
      // Motivos de pagamento: cancela sem reembolso, mas notifica o usuário
      if (isPaymentReason) {
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "payment_issue",
            rejection_reason: finalReason
          })
          .eq("id", appointment.id);

        if (error) throw error;

        toast.success("Agendamento recusado. O usuário será notificado sobre o problema de pagamento.");
        onRejected();
      } else {
        // Outros motivos: exigem reembolso - define prazo de 48h
        const refundDeadline = addHours(new Date(), 48);

        const { error } = await supabase
          .from("appointments")
          .update({
            status: "refund_pending",
            rejection_reason: finalReason,
            refund_deadline: refundDeadline.toISOString()
          })
          .eq("id", appointment.id);

        if (error) throw error;

        toast.warning("Agendamento recusado. Você tem 48h para realizar o ressarcimento ao paciente.", {
          duration: 6000
        });
        onRejected();
      }
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      toast.error("Erro ao recusar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-lg text-card-foreground">
            Recusar Agendamento
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {step === "confirm" ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-yellow-700 font-medium">Atenção!</p>
                  <p className="text-yellow-600 text-sm">
                    A recusa de agendamentos afeta sua Taxa de Conclusão.
                  </p>
                </div>
              </div>

              <p className="text-card-foreground text-center">
                Você deseja mesmo recusar a consulta com{" "}
                <strong>{appointment.profiles?.full_name || "este paciente"}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Não
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Sim
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Selecione o motivo da recusa:
              </p>

              {/* Motivos que exigem reembolso */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Motivos pessoais
                </p>
                {REFUND_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full p-3 rounded-xl text-left transition-colors border ${
                      selectedReason === reason.value
                        ? "bg-primary/10 border-primary text-card-foreground"
                        : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {selectedReason === "outro" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="w-full p-3 bg-background border border-border rounded-xl text-card-foreground resize-none h-24 focus:border-primary focus:outline-none"
                />
              )}

              {/* Aviso de reembolso para motivos pessoais */}
              {isRefundReason && (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-xl">
                  <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-600 text-sm">
                    Ao confirmar, você precisará <strong>solicitar a chave PIX</strong> do usuário para realizar o reembolso em até 48 horas.
                  </p>
                </div>
              )}

              {/* Separador */}
              <div className="border-t border-border my-2" />

              {/* Motivos relacionados a pagamento */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Problemas de pagamento
                </p>
                {PAYMENT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full p-3 rounded-xl text-left transition-colors border ${
                      selectedReason === reason.value
                        ? "bg-red-500/10 border-red-500 text-card-foreground"
                        : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {/* Aviso para problemas de pagamento */}
              {isPaymentReason && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">
                    O usuário será <strong>notificado</strong> sobre o problema no pagamento no card do agendamento.
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmitRejection}
                disabled={isSubmitting || !selectedReason || (selectedReason === "outro" && !customReason.trim())}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : isRefundReason ? (
                  "Solicitar chave PIX para reembolso"
                ) : (
                  "Confirmar Recusa"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RejectAppointmentDialog;
