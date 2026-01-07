import { useState, useEffect } from "react";
import { Clock, Upload, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RefundPendingCardProps {
  appointment: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    rejection_reason: string | null;
    refund_deadline: string | null;
    user_pix_key: string | null;
    user_pix_key_type: string | null;
    profiles?: {
      full_name: string | null;
    } | null;
    professional?: {
      hourly_rate: number | null;
    } | null;
  };
  onUpdate: () => void;
}

const RefundPendingCard = ({ appointment, onUpdate }: RefundPendingCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!appointment.refund_deadline) return;

    const updateTimeRemaining = () => {
      const deadline = parseISO(appointment.refund_deadline!);
      const now = new Date();
      const hoursLeft = differenceInHours(deadline, now);
      const minutesLeft = differenceInMinutes(deadline, now) % 60;

      if (hoursLeft < 0) {
        setTimeRemaining("Prazo expirado");
      } else if (hoursLeft < 1) {
        setTimeRemaining(`${minutesLeft} minutos restantes`);
      } else {
        setTimeRemaining(`${hoursLeft}h ${minutesLeft}min restantes`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [appointment.refund_deadline]);

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use JPG, PNG, WebP ou PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `refund-${appointment.id}-${Date.now()}.${fileExt}`;
      const filePath = `refunds/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update appointment with refund receipt
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          refund_receipt_url: filePath,
          refund_sent_at: new Date().toISOString(),
          status: 'refund_sent'
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      toast.success("Comprovante enviado com sucesso!");
      onUpdate();
    } catch (error) {
      console.error("Error uploading refund receipt:", error);
      toast.error("Erro ao enviar comprovante");
    } finally {
      setIsUploading(false);
    }
  };

  const isDeadlineExpired = appointment.refund_deadline && new Date() > parseISO(appointment.refund_deadline);

  return (
    <div className="bg-card border border-orange-500/50 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-card-foreground">
            Ressarcimento Pendente
          </h3>
          <p className="text-muted-foreground text-sm">
            {appointment.profiles?.full_name || "Paciente"} - {format(parseISO(appointment.scheduled_date), "dd/MM", { locale: ptBR })} às {appointment.scheduled_time}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          isDeadlineExpired ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
        }`}>
          <Clock className="w-3 h-3" />
          {timeRemaining}
        </div>
      </div>

      {appointment.rejection_reason && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Motivo da recusa:</strong> {appointment.rejection_reason}
          </p>
        </div>
      )}

      {appointment.user_pix_key ? (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-card-foreground">
            <strong>Chave PIX do paciente:</strong>
          </p>
          <p className="text-card-foreground font-mono text-sm mt-1">
            {appointment.user_pix_key}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tipo: {appointment.user_pix_key_type || "Não informado"}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg">
          <p className="text-sm text-yellow-600">
            Aguardando o paciente informar a chave PIX para ressarcimento.
          </p>
        </div>
      )}

      {appointment.user_pix_key && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Valor a ressarcir: <strong className="text-card-foreground">
              R$ {appointment.professional?.hourly_rate?.toFixed(2).replace(".", ",") || "0,00"}
            </strong>
          </p>

          <label className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            isUploading ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Enviar Comprovante do PIX
              </>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleUploadReceipt}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default RefundPendingCard;
