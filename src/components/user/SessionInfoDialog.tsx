import { X, Calendar, Clock, User, Mail, Phone, Link, AlertCircle, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SessionInfoDialogProps {
  appointment: {
    id: string;
    professional_id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    notes: string | null;
    consultation_link: string | null;
    professional?: {
      crp: string;
      degree: string | null;
      hourly_rate: number | null;
    } | null;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
      phone?: string | null;
    } | null;
    professional_email?: string;
  };
  onClose: () => void;
}

const SessionInfoDialog = ({ appointment, onClose }: SessionInfoDialogProps) => {
  const navigate = useNavigate();

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
            Informações da Sessão
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
          {/* Professional Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dados do Profissional
            </h4>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-therapy/20 flex items-center justify-center overflow-hidden">
                  {appointment.profile?.avatar_url ? (
                    <img 
                      src={appointment.profile.avatar_url} 
                      alt={appointment.profile.full_name || "Profissional"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-therapy" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {appointment.profile?.full_name || "Profissional"}
                  </p>
                  {appointment.professional && (
                    <p className="text-muted-foreground text-sm">
                      CRP {appointment.professional.crp}
                      {appointment.professional.degree && ` • ${appointment.professional.degree}`}
                    </p>
                  )}
                </div>
              </div>
              
              {appointment.professional_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-card-foreground">{appointment.professional_email}</span>
                </div>
              )}
              
              {appointment.profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-card-foreground">{appointment.profile.phone}</span>
                </div>
              )}

              {/* View Profile Button */}
              <button
                onClick={() => navigate(`/profissional/${appointment.professional_id}`)}
                className="w-full mt-2 py-2 bg-therapy/10 text-therapy rounded-xl font-medium hover:bg-therapy/20 transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Ver Perfil do Profissional
              </button>
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

          {/* Price if available */}
          {appointment.professional?.hourly_rate && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Valor da Sessão
              </h4>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-card-foreground font-bold text-lg">
                  R$ {appointment.professional.hourly_rate.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          )}

          {/* Consultation Link */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Link da Consulta Online
            </h4>
            {appointment.consultation_link ? (
              <a
                href={appointment.consultation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-therapy/10 border border-therapy/30 rounded-xl hover:bg-therapy/20 transition-colors"
              >
                <Link className="w-5 h-5 text-therapy" />
                <span className="text-therapy font-medium flex-1 truncate">
                  {appointment.consultation_link}
                </span>
                <ExternalLink className="w-4 h-4 text-therapy" />
              </a>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-700 font-medium">Aguardando link</p>
                  <p className="text-yellow-600/80">
                    O profissional enviará o link para a consulta online 10 minutos antes do horário agendado.
                  </p>
                </div>
              </div>
            )}
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

export default SessionInfoDialog;
