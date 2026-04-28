import { Crown } from "lucide-react";
import SubscriptionPlans from "@/components/professional/SubscriptionPlans";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionConfig";

interface StepSubscriptionProps {
  professionalId: string;
  onSubscribed: () => void;
}

const StepSubscription = ({ professionalId, onSubscribed }: StepSubscriptionProps) => {
  const { data: settings } = useSubscriptionSettings();
  const title = settings?.onboarding_subscription_text || "Escolha seu Plano";
  const subtitle = settings?.onboarding_subscription_subtitle || "Selecione o plano ideal para ativar seu perfil no marketplace";

  return (
    <div>
      <div className="text-center mb-6">
        <Crown className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <SubscriptionPlans
        professionalId={professionalId}
        onSubscribe={onSubscribed}
      />
    </div>
  );
};

export default StepSubscription;
