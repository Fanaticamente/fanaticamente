import { useState } from "react";
import { X, Calendar, Clock, User, Mail, Phone, Link, AlertCircle, Copy, Check } from "lucide-react";
import { format, parseISO, subMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppointmentDetailsDialogProps {
  appointment: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    notes: string | null;
    consultation_link: string | null;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
    } | null;
    user_email?: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

const AppointmentDetailsDialog = ({ appointment, onClose, onUpdate }: AppointmentDetailsDialogProps) => {
  const [consultationLink, setConsultationLink] = useState(appointment.consultation_link || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveLink = async () => {
    if (!consultationLink.trim()) {
      toast.error("Insira um link válido");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ consultation_link: consultationLink.trim() })
        .eq("id", appointment.id);

      if (error) throw error;
      
      toast.success("Link salvo com sucesso!");
      onUpdate();
    } catch (error) {
      console.error("Error saving consultation link:", error);
      toast.error("Erro ao salvar link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(consultationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  };

  // Calculate reminder time (10 min before)
  const appointmentDateTime = parseISO(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
  const reminderTime = subMinutes(appointmentDateTime, 10);

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-lg text-card-foreground">
            Detalhes do Agendamento
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Patient Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dados do Paciente
            </h4>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-therapy/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-therapy" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {appointment.profiles?.full_name || "Paciente"}
                  </p>
                </div>
              </div>
              
              {appointment.user_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-card-foreground">{appointment.user_email}</span>
                </div>
              )}
              
              {appointment.profiles?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-card-foreground">{appointment.profiles.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Data e Horário
            </h4>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-card-foreground">
                  {format(parseISO(appointment.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-card-foreground">{appointment.scheduled_time}</span>
              </div>
            </div>
          </div>

          {/* Consultation Link */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Link da Consulta Online
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={consultationLink}
                    onChange={(e) => setConsultationLink(e.target.value)}
                    placeholder="https://meet.google.com/... ou zoom.us/..."
                    className="w-full h-12 pl-10 pr-4 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors"
                  />
                </div>
                {consultationLink && (
                  <button
                    onClick={handleCopyLink}
                    className="px-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              
              <button
                onClick={handleSaveLink}
                disabled={isSaving || !consultationLink.trim()}
                className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:bg-therapy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Salvando..." : "Salvar Link"}
              </button>

              {/* Reminder Info */}
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-700 font-medium">Lembrete importante</p>
                  <p className="text-yellow-600/80">
                    Envie o link ao paciente <strong>10 minutos antes</strong> do horário agendado 
                    ({format(reminderTime, "HH:mm", { locale: ptBR })}).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Observações
              </h4>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-card-foreground text-sm">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <span className="text-muted-foreground text-sm">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                appointment.status === "confirmed"
                  ? "bg-green-500/20 text-green-500"
                  : appointment.status === "cancelled"
                  ? "bg-red-500/20 text-red-500"
                  : "bg-yellow-500/20 text-yellow-500"
              }`}
            >
              {appointment.status === "confirmed" 
                ? "Confirmado" 
                : appointment.status === "cancelled" 
                ? "Cancelado" 
                : "Pendente"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsDialog;
