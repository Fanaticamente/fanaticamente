import { AlertTriangle, RefreshCw } from "lucide-react";

interface ApprovalPendingBannerProps {
  approvalStatus: string | null;
  rejectionReason: string | null;
  onResubmit?: () => void;
}

const ApprovalPendingBanner = ({ approvalStatus, rejectionReason, onResubmit }: ApprovalPendingBannerProps) => {
  if (!approvalStatus || approvalStatus === "approved") {
    return null;
  }

  const getBannerContent = () => {
    switch (approvalStatus) {
      case "pending_approval":
        return {
          title: "Aguardando Aprovação",
          message: "Seu perfil está em análise pela nossa equipe. Verificaremos seus dados e número do CRP. Este processo pode levar até 48 horas úteis.",
          style: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
          iconColor: "text-yellow-500"
        };
      case "pending_payment":
        return {
          title: "Aguardando Pagamento",
          message: "Complete a assinatura para que seu perfil entre em análise e seja publicado no marketplace.",
          style: "bg-blue-500/10 border-blue-500/30 text-blue-600",
          iconColor: "text-blue-500"
        };
      case "needs_correction":
        return {
          title: "Correções Necessárias",
          message: rejectionReason || "Seu perfil precisa de correções. Verifique as mensagens administrativas para mais detalhes.",
          style: "bg-orange-500/10 border-orange-500/30 text-orange-600",
          iconColor: "text-orange-500",
          showResubmit: true
        };
      case "rejected":
        return {
          title: "Cadastro Reprovado",
          message: rejectionReason || "Seu cadastro foi reprovado. Entre em contato com o suporte para mais informações.",
          style: "bg-red-500/10 border-red-500/30 text-red-600",
          iconColor: "text-red-500"
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div className={`p-4 rounded-xl border ${content.style} mb-6`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${content.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-medium text-sm">{content.title}</h4>
          <p className="text-sm opacity-80 mt-1">{content.message}</p>
          {content.showResubmit && onResubmit && (
            <button
              onClick={onResubmit}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reenviar para Análise
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalPendingBanner;
