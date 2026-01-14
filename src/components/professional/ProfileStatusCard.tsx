import { AlertCircle, CheckCircle, Shield } from "lucide-react";

interface ProfileStatusCardProps {
  isProfileComplete: boolean;
  isSubscribed: boolean;
  clubName: string | null;
}

const ProfileStatusCard = ({ isProfileComplete, isSubscribed, clubName }: ProfileStatusCardProps) => {
  const getStatus = () => {
    if (!isProfileComplete) {
      return {
        status: "incomplete",
        label: "Perfil Incompleto",
        message: "Complete seu perfil para aparecer no marketplace",
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/30",
        icon: AlertCircle
      };
    }
    if (!isSubscribed) {
      return {
        status: "pending",
        label: "Aguardando Assinatura",
        message: "Assine um plano para ativar seu perfil",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: Shield
      };
    }
    return {
      status: "active",
      label: "Perfil Ativo",
      message: `Seu perfil está visível no marketplace de ${clubName || "seu time"}`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      icon: CheckCircle
    };
  };

  const statusInfo = getStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`rounded-xl p-4 border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <div className="flex items-center gap-3">
        <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
        <div>
          <h3 className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</h3>
          <p className="text-muted-foreground text-sm">{statusInfo.message}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileStatusCard;
