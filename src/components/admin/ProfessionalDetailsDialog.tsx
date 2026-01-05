import { useState } from "react";
import { X, User, Mail, Phone, Calendar, MapPin, Award, FileText, MessageSquare, Trash2, CheckCircle, XCircle, Send, AlertTriangle, Eye, Clock, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
  tableBg: string;
}

interface Professional {
  id: string;
  user_id: string;
  crp: string;
  bio: string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
  experience_years: number | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  degree: string | null;
  document_type: string | null;
  document_number: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  crp_document_front_url: string | null;
  crp_document_back_url: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    birth_date: string | null;
    city: string | null;
    state: string | null;
  };
  email?: string;
  club?: {
    id: string;
    name: string;
    primary_color: string;
    badge_url: string | null;
  };
  appointmentsCount: number;
}

interface ProfessionalDetailsDialogProps {
  professional: Professional | null;
  open: boolean;
  onClose: () => void;
  themeStyles: ThemeStyles;
  onRefresh: () => void;
}

const ADMIN_PASSWORD = "fanatica2025"; // In production, this should be verified server-side

const ProfessionalDetailsDialog = ({
  professional,
  open,
  onClose,
  themeStyles,
  onRefresh,
}: ProfessionalDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "documents" | "message" | "delete">("info");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "warning" | "alert">("info");
  const [isSending, setIsSending] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  if (!professional) return null;

  const age = professional.profile?.birth_date
    ? differenceInYears(new Date(), parseISO(professional.profile.birth_date))
    : null;

  const getApprovalStatusInfo = (status: string | null) => {
    switch (status) {
      case "approved":
        return { label: "Aprovado", className: "bg-green-500/20 text-green-500", icon: CheckCircle };
      case "pending_approval":
        return { label: "Aguardando Aprovação", className: "bg-yellow-500/20 text-yellow-500", icon: Clock };
      case "rejected":
        return { label: "Reprovado", className: "bg-red-500/20 text-red-500", icon: XCircle };
      case "needs_correction":
        return { label: "Correção Necessária", className: "bg-orange-500/20 text-orange-500", icon: AlertTriangle };
      case "pending_payment":
        return { label: "Aguardando Pagamento", className: "bg-blue-500/20 text-blue-500", icon: CreditCard };
      default:
        return { label: "Pendente", className: "bg-gray-500/20 text-gray-500", icon: Clock };
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("admin_messages").insert({
        professional_id: professional.id,
        admin_user_id: user.id,
        message: message.trim(),
        message_type: messageType,
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso!");
      setMessage("");
      setActiveTab("info");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from("professionals")
        .update({
          approval_status: "approved",
          is_active: true,
          is_verified: true,
          rejection_reason: null,
        })
        .eq("id", professional.id);

      if (error) throw error;

      // Send approval message
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_messages").insert({
          professional_id: professional.id,
          admin_user_id: user.id,
          message: "Parabéns! Seu perfil foi aprovado e agora está visível no marketplace.",
          message_type: "approval",
        });
      }

      toast.success("Profissional aprovado com sucesso!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Erro ao aprovar profissional");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da reprovação");
      return;
    }

    setIsApproving(true);
    try {
      const { error } = await supabase
        .from("professionals")
        .update({
          approval_status: "needs_correction",
          is_active: false,
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", professional.id);

      if (error) throw error;

      // Send rejection message
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_messages").insert({
          professional_id: professional.id,
          admin_user_id: user.id,
          message: `Seu perfil necessita de correções: ${rejectionReason.trim()}`,
          message_type: "rejection",
        });
      }

      toast.success("Solicitação de correção enviada!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Erro ao reprovar profissional");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async () => {
    if (deletePassword !== ADMIN_PASSWORD) {
      toast.error("Senha de segurança incorreta");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", professional.id);

      if (error) throw error;

      toast.success("Perfil profissional excluído com sucesso!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir profissional");
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
    }
  };

  const getSubscriptionLabel = (type: string | null) => {
    switch (type) {
      case "annual": return "Anual";
      case "semiannual": return "Semestral";
      case "monthly": return "Mensal";
      default: return "Nenhum";
    }
  };

  const statusInfo = getApprovalStatusInfo(professional.approval_status);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/20 flex items-center justify-center">
              {professional.profile?.avatar_url ? (
                <img
                  src={professional.profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <span className="block">{professional.profile?.full_name || "Sem nome"}</span>
              <span className="text-sm text-muted-foreground">CRP: {professional.crp}</span>
            </div>
            {professional.club && (
              <div className="ml-auto flex items-center gap-2">
                {professional.club.badge_url && (
                  <img
                    src={professional.club.badge_url}
                    alt={professional.club.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <span className="text-sm" style={{ color: professional.club.primary_color }}>
                  {professional.club.name}
                </span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${statusInfo.className}`}>
            <statusInfo.icon className="w-4 h-4" />
            {statusInfo.label}
          </span>
          {professional.rejection_reason && (
            <span className="text-sm text-red-500">
              Motivo: {professional.rejection_reason}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2 mb-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "info" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "documents" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "message" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Mensagem
          </button>
          <button
            onClick={() => setActiveTab("delete")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "delete" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted text-destructive"
            }`}
          >
            Excluir
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              {professional.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{professional.email}</span>
                </div>
              )}
              {professional.profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{professional.profile.phone}</span>
                </div>
              )}
              {age && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{age} anos</span>
                </div>
              )}
              {(professional.profile?.city || professional.profile?.state) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[professional.profile.city, professional.profile.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Professional Info */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Formação:</span>
                <span className="text-sm">{professional.degree || "Não informado"}</span>
              </div>

              <div>
                <span className="text-sm font-medium">Especialidades:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {professional.specialties?.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  )) || <span className="text-sm text-muted-foreground">Nenhuma</span>}
                </div>
              </div>

              {professional.bio && (
                <div>
                  <span className="text-sm font-medium">Bio:</span>
                  <p className="text-sm text-muted-foreground mt-1">{professional.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <span className="ml-2 text-sm">{getSubscriptionLabel(professional.subscription_type)}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Consultas:</span>
                  <span className="ml-2 text-sm">{professional.appointmentsCount}</span>
                </div>
                {professional.hourly_rate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Valor da sessão:</span>
                    <span className="ml-2 text-sm">R$ {professional.hourly_rate}</span>
                  </div>
                )}
                {professional.document_type && professional.document_number && (
                  <div>
                    <span className="text-sm text-muted-foreground">{professional.document_type.toUpperCase()}:</span>
                    <span className="ml-2 text-sm">{professional.document_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Actions */}
            {professional.approval_status === "pending_approval" && (
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="font-medium">Aprovação do Perfil</h4>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo da reprovação ou correções necessárias..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm min-h-[80px] resize-none"
                  />
                  <button
                    onClick={handleReject}
                    disabled={isApproving || !rejectionReason.trim()}
                    className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Solicitar Correções
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <h4 className="font-medium">Documentos de Verificação</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Carteira CRP (Frente)</label>
                {professional.crp_document_front_url ? (
                  <a
                    href={professional.crp_document_front_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Visualizar documento</span>
                    </div>
                  </a>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Não enviado</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carteira CRP (Verso)</label>
                {professional.crp_document_back_url ? (
                  <a
                    href={professional.crp_document_back_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Visualizar documento</span>
                    </div>
                  </a>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Não enviado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "message" && (
          <div className="space-y-4">
            <h4 className="font-medium">Enviar Mensagem Interna</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo de mensagem</label>
                <div className="flex gap-2">
                  {[
                    { value: "info", label: "Informação", color: "bg-blue-500" },
                    { value: "warning", label: "Aviso", color: "bg-yellow-500" },
                    { value: "alert", label: "Alerta", color: "bg-red-500" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setMessageType(type.value as any)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        messageType === type.value
                          ? `${type.color} text-white`
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem para o profissional..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm min-h-[120px] resize-none"
              />

              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSending ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "delete" && (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Atenção!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta ação é irreversível. Todos os dados do profissional, incluindo agendamentos,
                    mensagens e histórico, serão permanentemente excluídos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Senha de Segurança</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite a senha de segurança do administrador"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
              <button
                onClick={handleDelete}
                disabled={isDeleting || !deletePassword}
                className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-destructive/90 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Excluindo..." : "Excluir Perfil Permanentemente"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetailsDialog;
