import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
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

const REJECTION_REASONS = [
  { value: "payment_issue", label: "O pagamento não foi realizado corretamente" },
  { value: "schedule_conflict", label: "Conflito de horário" },
  { value: "personal_emergency", label: "Emergência pessoal" },
  { value: "health_issue", label: "Problema de saúde" },
  { value: "other", label: "Outro motivo" }
];

const RejectAppointmentDialog = ({ appointment, onClose, onRejected }: RejectAppointmentDialogProps) => {
  const [step, setStep] = useState<"confirm" | "reason">("confirm");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmReject = () => {
    setStep("reason");
  };

  const handleSubmitRejection = async () => {
    if (!selectedReason) {
      toast.error("Selecione um motivo para a recusa");
      return;
    }

    const finalReason = selectedReason === "other" ? customReason : REJECTION_REASONS.find(r => r.value === selectedReason)?.label;

    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Informe o motivo da recusa");
      return;
    }

    setIsSubmitting(true);
    try {
      // If it's a payment issue, just cancel - no refund needed
      if (selectedReason === "payment_issue") {
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            rejection_reason: finalReason
          })
          .eq("id", appointment.id);

        if (error) throw error;

        toast.success("Agendamento recusado com sucesso");
        onRejected();
      } else {
        // Other reasons require refund - set 48h deadline
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
                Informe o motivo da recusa:
              </p>

              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
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

              {selectedReason === "other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="w-full p-3 bg-background border border-border rounded-xl text-card-foreground resize-none h-24 focus:border-primary focus:outline-none"
                />
              )}

              {selectedReason && selectedReason !== "payment_issue" && (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-600 text-sm">
                    Você terá <strong>48 horas</strong> para realizar o ressarcimento via PIX ao paciente. 
                    Caso não cumpra o prazo, suas operações no app serão bloqueadas.
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmitRejection}
                disabled={isSubmitting || !selectedReason}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
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
