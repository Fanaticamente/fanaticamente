import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const REASONS = [
  { value: "imprevisto", label: "Imprevisto" },
  { value: "problemas_pessoais", label: "Problemas pessoais" },
  { value: "indisponibilidade", label: "Indisponibilidade de horário" },
  { value: "outro", label: "Outro" },
];

const RejectAppointmentDialog = ({ appointment, onClose, onRejected }: RejectAppointmentDialogProps) => {
  const [step, setStep] = useState<"confirm" | "reason">("confirm");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmReject = () => {
    setStep("reason");
  };

  const getReasonLabel = () => {
    if (selectedReason === "outro") return customReason;
    return REASONS.find(r => r.value === selectedReason)?.label || "";
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
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          rejection_reason: finalReason,
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Agendamento recusado. O usuário será notificado.");
      onRejected();
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      toast.error("Erro ao recusar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
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

              <div className="space-y-2">
                {REASONS.map((reason) => (
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
