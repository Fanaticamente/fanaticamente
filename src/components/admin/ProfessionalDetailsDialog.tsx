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
      // Call edge function to completely delete user and all related data
      const { data, error } = await supabase.functions.invoke("delete-user-completely", {
        body: {
          userId: professional.user_id,
          adminPassword: deletePassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Conta excluída completamente do sistema!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir conta");
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
              {professional.profile?.avatar_url ? (
                <img
                  src={professional.profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <User className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-gray-900">{professional.profile?.full_name || "Sem nome"}</span>
                {professional.club && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                    {professional.club.badge_url && (
                      <img
                        src={professional.club.badge_url}
                        alt={professional.club.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {professional.club.name}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-base text-gray-500">CRP: {professional.crp}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Status Badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`px-4 py-2 rounded-full text-base flex items-center gap-2 ${statusInfo.className}`}>
            <statusInfo.icon className="w-5 h-5" />
            {statusInfo.label}
          </span>
          {professional.rejection_reason && (
            <span className="text-base text-red-500">
              Motivo: {professional.rejection_reason}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
              activeTab === "info" ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
              activeTab === "documents" ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
              activeTab === "message" ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Mensagem
          </button>
          <button
            onClick={() => setActiveTab("delete")}
            className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 ${
              activeTab === "delete" ? "bg-red-500 text-white" : "hover:bg-red-50 text-red-600"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span className="text-base text-gray-800">{professional.email || "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600" />
                <span className="text-base text-gray-800">{professional.profile?.phone || "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-base text-gray-800">{age ? `${age} anos` : "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="text-base text-gray-800">
                  {professional.profile?.city && professional.profile?.state 
                    ? `${professional.profile.city}, ${professional.profile.state}`
                    : professional.profile?.city || professional.profile?.state || "Não informado"}
                </span>
              </div>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-5">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Tipo de Documento</span>
                <p className="text-base font-medium text-gray-800">{professional.document_type?.toUpperCase() || "Não informado"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Número do Documento</span>
                <p className="text-base font-medium text-gray-800">{professional.document_number || "Não informado"}</p>
              </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-5 pt-5 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-medium text-gray-800">Formação:</span>
                <span className="text-base text-gray-700">{professional.degree || "Não informado"}</span>
              </div>

              <div>
                <span className="text-base font-medium text-gray-800">Especialidades:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {professional.specialties?.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  )) || <span className="text-base text-gray-500">Nenhuma</span>}
                </div>
              </div>

              {professional.bio && (
                <div>
                  <span className="text-base font-medium text-gray-800">Bio:</span>
                  <p className="text-base text-gray-600 mt-2 leading-relaxed">{professional.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 pt-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Plano</span>
                  <p className="text-base font-medium text-gray-800">{getSubscriptionLabel(professional.subscription_type)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Consultas</span>
                  <p className="text-base font-medium text-gray-800">{professional.appointmentsCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Valor da sessão</span>
                  <p className="text-base font-medium text-emerald-600">{professional.hourly_rate ? `R$ ${professional.hourly_rate}` : "Não definido"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Anos de experiência</span>
                  <p className="text-base font-medium text-gray-800">{professional.experience_years || 0}</p>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            {professional.approval_status === "pending_approval" && (
              <div className="pt-5 border-t border-gray-200 space-y-5">
                <h4 className="text-lg font-semibold text-gray-800">Aprovação do Perfil</h4>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar
                  </button>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo da reprovação ou correções necessárias..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base min-h-[100px] resize-none text-gray-800 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleReject}
                    disabled={isApproving || !rejectionReason.trim()}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Solicitar Correções
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-5">
            <h4 className="text-lg font-semibold text-gray-800">Documentos de Verificação</h4>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700">Carteira CRP (Frente)</label>
                {professional.crp_document_front_url ? (
                  <a
                    href={professional.crp_document_front_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Eye className="w-5 h-5" />
                      <span className="text-base font-medium">Visualizar documento</span>
                    </div>
                  </a>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-base text-gray-500">Não enviado</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700">Carteira CRP (Verso)</label>
                {professional.crp_document_back_url ? (
                  <a
                    href={professional.crp_document_back_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Eye className="w-5 h-5" />
                      <span className="text-base font-medium">Visualizar documento</span>
                    </div>
                  </a>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-base text-gray-500">Não enviado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "message" && (
          <div className="space-y-5">
            <h4 className="text-lg font-semibold text-gray-800">Enviar Mensagem Interna</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-base font-medium mb-2 block text-gray-700">Tipo de mensagem</label>
                <div className="flex gap-3">
                  {[
                    { value: "info", label: "Informação", color: "bg-blue-500" },
                    { value: "warning", label: "Aviso", color: "bg-yellow-500" },
                    { value: "alert", label: "Alerta", color: "bg-red-500" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setMessageType(type.value as any)}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        messageType === type.value
                          ? `${type.color} text-white`
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base min-h-[140px] resize-none text-gray-800 placeholder:text-gray-400"
              />

              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {isSending ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "delete" && (
          <div className="space-y-5">
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-lg font-semibold text-red-600">Atenção!</h4>
                  <p className="text-base text-gray-600 mt-2">
                    Esta ação é irreversível. Todos os dados do profissional, incluindo agendamentos,
                    mensagens e histórico, serão permanentemente excluídos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-base font-medium text-gray-700">Senha de Segurança</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite a senha de segurança do administrador"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-800 placeholder:text-gray-400"
              />
              <button
                onClick={handleDelete}
                disabled={isDeleting || !deletePassword}
                className="w-full py-3 bg-red-500 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
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
