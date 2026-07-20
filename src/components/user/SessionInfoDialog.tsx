import { X, Calendar, Clock, User, Mail, Phone, Link, AlertCircle, ExternalLink, MessageCircle } from "lucide-react";
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

  const getStatusDisplay = () => {
    switch (appointment.status) {
      case "in_progress":
        return { label: "Em Atendimento", className: "bg-blue-500/20 text-blue-500" };
      case "link_sent":
        return { label: "Link Enviado", className: "bg-cyan-500/20 text-cyan-500" };
      case "confirmed":
        return { label: "Confirmado", className: "bg-green-500/20 text-green-500" };
      case "completed":
        return { label: "Concluído", className: "bg-purple-500/20 text-purple-500" };
      case "cancelled":
        return { label: "Cancelado", className: "bg-red-500/20 text-red-500" };
      default:
        return { label: "Pendente", className: "bg-yellow-500/20 text-yellow-500" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-sans text-lg text-slate-900">
            Informações da Sessão
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Professional Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500">
              Dados do profissional
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--club-50)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {appointment.profile?.avatar_url ? (
                    <img 
                      src={appointment.profile.avatar_url} 
                      alt={appointment.profile.full_name || "Profissional"} 
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <User className="w-6 h-6 text-[var(--club-600)]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {appointment.profile?.full_name || "Profissional"}
                  </p>
                  {appointment.professional && (
                    <p className="text-slate-500 text-sm">
                      CRP {appointment.professional.crp}
                      {appointment.professional.degree && ` • ${appointment.professional.degree}`}
                    </p>
                  )}
                </div>
              </div>
              
              {appointment.professional_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-900">{appointment.professional_email}</span>
                </div>
              )}
              
              {appointment.profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-900 flex-1">{appointment.profile.phone}</span>
                  <a
                    href={`https://wa.me/${appointment.profile.phone.replace(/\D/g, '').replace(/^(\d{10,11})$/, '55$1')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 transition-colors text-xs font-medium"
                    title="Iniciar conversa no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              )}

              {/* View Profile Button */}
              <button
                onClick={() => navigate(`/profissional/${appointment.professional_id}`)}
                className="w-full mt-2 py-2 bg-[var(--club-50)] text-[var(--club-600)] rounded-xl font-medium hover:bg-[var(--club-100)] transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Ver Perfil do Profissional
              </button>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500">
              Data e horário
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[var(--club-600)]" />
                <span className="text-slate-900">
                  {format(parseISO(appointment.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--club-600)]" />
                <span className="text-slate-900">{appointment.scheduled_time}</span>
              </div>
            </div>
          </div>

          {/* Price if available */}
          {appointment.professional?.hourly_rate && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-500">
                Valor da sessão
              </h4>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-900 font-bold text-lg">
                  R$ {appointment.professional.hourly_rate.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          )}

          {/* Consultation Link */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500">
              Link da consulta online
            </h4>
            {appointment.consultation_link ? (
              <a
                href={appointment.consultation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-[var(--club-50)] border border-[var(--club-200)] rounded-xl hover:bg-[var(--club-100)] transition-colors"
              >
                <Link className="w-5 h-5 text-[var(--club-600)]" />
                <span className="text-[var(--club-600)] font-medium flex-1 truncate">
                  {appointment.consultation_link}
                </span>
                <ExternalLink className="w-4 h-4 text-[var(--club-600)]" />
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
              <h4 className="text-sm font-medium text-slate-500">
                Observações
              </h4>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-900 text-sm">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 text-sm">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
              {statusDisplay.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionInfoDialog;