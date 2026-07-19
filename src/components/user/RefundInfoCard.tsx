import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface RefundInfoCardProps {
  appointment: {
    id: string;
    professional_id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    rejection_reason?: string | null;
    user_pix_key?: string | null;
    user_pix_key_type?: string | null;
    refund_receipt_url?: string | null;
    refund_deadline?: string | null;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    professional?: {
      hourly_rate: number | null;
    } | null;
  };
  onUpdate: () => void;
}

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" }
];

const RefundInfoCard = ({ appointment, onUpdate }: RefundInfoCardProps) => {
  const { user } = useAuth();
  const [pixKey, setPixKey] = useState(appointment.user_pix_key || "");
  const [pixKeyType, setPixKeyType] = useState(appointment.user_pix_key_type || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);

  // Load receipt URL if available
  useEffect(() => {
    if (appointment.refund_receipt_url) {
      loadReceiptUrl();
    }
  }, [appointment.refund_receipt_url]);

  const loadReceiptUrl = async () => {
    if (!appointment.refund_receipt_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(appointment.refund_receipt_url, 3600);

      if (!error && data) {
        setReceiptUrl(data.signedUrl);
      }
    } catch (error) {
      console.error("Error loading receipt:", error);
    }
  };

  const handleSavePixKey = async () => {
    if (!pixKey.trim() || !pixKeyType) {
      toast.error("Preencha a chave PIX e o tipo");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          user_pix_key: pixKey.trim(),
          user_pix_key_type: pixKeyType
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Chave PIX salva com sucesso!");
      onUpdate();
    } catch (error) {
      console.error("Error saving PIX key:", error);
      toast.error("Erro ao salvar chave PIX");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRefund = async () => {
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Ressarcimento confirmado!");
      onUpdate();
    } catch (error) {
      console.error("Error confirming refund:", error);
      toast.error("Erro ao confirmar ressarcimento");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Descreva o ocorrido");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsSubmittingDispute(true);
    try {
      // Create dispute
      const { error: disputeError } = await supabase
        .from("appointment_disputes")
        .insert({
          appointment_id: appointment.id,
          user_id: user.id,
          professional_id: appointment.professional_id,
          reason: disputeReason,
          status: "pending"
        });

      if (disputeError) throw disputeError;

      // Update appointment status
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          status: "disputed",
          dispute_reason: disputeReason,
          dispute_created_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      toast.success("Contestação enviada! Nossa equipe irá analisar o caso.", {
        duration: 5000
      });
      setShowDispute(false);
      onUpdate();
    } catch (error) {
      console.error("Error submitting dispute:", error);
      toast.error("Erro ao enviar contestação");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Show different UI based on status
  if (appointment.status === "refund_pending") {
    // Professional rejected, waiting for user's PIX key
    return (
      <div className="bg-white border border-orange-500/50 rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Sessão Recusada</h3>
            <p className="text-slate-500 text-sm">
              {format(parseISO(appointment.scheduled_date), "dd/MM", { locale: ptBR })} às {appointment.scheduled_time}
            </p>
          </div>
        </div>

        <div className="p-3 bg-orange-500/10 rounded-lg">
          <p className="text-orange-700 text-sm">
            A sessão não pôde ser confirmada pelo(a) profissional por motivo extraordinário.
          </p>
          {appointment.rejection_reason && (
            <p className="text-orange-600 text-xs mt-1">
              Motivo: {appointment.rejection_reason}
            </p>
          )}
        </div>

        {!appointment.user_pix_key ? (
          <div className="space-y-3">
            <p className="text-slate-900 text-sm">
              Informe abaixo a sua chave Pix para o(a) profissional fazer o ressarcimento do valor pago.
            </p>

            <div className="space-y-2">
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSavePixKey}
              disabled={isSaving || !pixKey.trim() || !pixKeyType}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Chave PIX"
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              O profissional tem até 48h para realizar o ressarcimento.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">
              Chave PIX informada: <strong className="text-slate-900">{appointment.user_pix_key}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Aguardando o profissional enviar o comprovante de ressarcimento.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (appointment.status === "refund_sent") {
    // Professional sent refund receipt, waiting for user confirmation
    return (
      <div className="bg-white border border-green-500/50 rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Ressarcimento Enviado</h3>
            <p className="text-slate-500 text-sm">
              {format(parseISO(appointment.scheduled_date), "dd/MM", { locale: ptBR })} às {appointment.scheduled_time}
            </p>
          </div>
        </div>

        <div className="p-3 bg-green-500/10 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            Ressarcimento efetuado com sucesso!
          </p>
          <p className="text-green-600 text-xs mt-1">
            O profissional enviou o comprovante de pagamento.
          </p>
        </div>

        {receiptUrl && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Comprovante de Ressarcimento
            </h4>
            <button
              type="button"
              onClick={() => setShowReceiptViewer(true)}
              className="w-full flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-emerald-600 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Ver Comprovante de Ressarcimento
            </button>

            <Dialog open={showReceiptViewer} onOpenChange={setShowReceiptViewer}>
              <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl h-[85vh] p-0 overflow-hidden z-[100]">
                <DialogTitle className="sr-only">Comprovante de Ressarcimento</DialogTitle>
                {appointment.refund_receipt_url?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={receiptUrl}
                    title="Comprovante de Ressarcimento"
                    className="w-full h-full bg-white rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full overflow-auto bg-white rounded-2xl flex items-start justify-center p-2">
                    <img
                      src={receiptUrl}
                      alt="Comprovante de Ressarcimento"
                      className="max-w-full h-auto object-contain"
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleConfirmRefund}
            disabled={isConfirming}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Ressarcimento Confirmado
              </>
            )}
          </button>

          {!showDispute ? (
            <button
              onClick={() => setShowDispute(true)}
              className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Não recebi o pagamento
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-red-500/10 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                Relate o ocorrido para nossa equipe analisar:
              </p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 resize-none h-24 focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDispute(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={isSubmittingDispute || !disputeReason.trim()}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingDispute ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Enviar Contestação"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appointment.status === "disputed") {
    return (
      <div className="bg-white border border-red-500/50 rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Em Análise</h3>
            <p className="text-slate-500 text-sm">
              {format(parseISO(appointment.scheduled_date), "dd/MM", { locale: ptBR })} às {appointment.scheduled_time}
            </p>
          </div>
        </div>

        <div className="p-3 bg-red-500/10 rounded-lg">
          <p className="text-red-700 text-sm">
            Sua contestação foi enviada e está sendo analisada pela nossa equipe de suporte. 
            Você será notificado sobre a resolução.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default RefundInfoCard;
