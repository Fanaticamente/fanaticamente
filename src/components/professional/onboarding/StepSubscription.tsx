import { Crown } from "lucide-react";
import SubscriptionPlans from "@/components/professional/SubscriptionPlans";

interface StepSubscriptionProps {
  professionalId: string;
  onSubscribed: () => void;
}

const StepSubscription = ({ professionalId, onSubscribed }: StepSubscriptionProps) => {
  return (
    <div>
      <div className="text-center mb-6">
        <Crown className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Escolha seu Plano</h3>
        <p className="text-sm text-muted-foreground mt-1">Selecione o plano ideal para ativar seu perfil no marketplace</p>
      </div>

      <SubscriptionPlans
        professionalId={professionalId}
        onSubscribe={onSubscribed}
      />
    </div>
  );
};

export default StepSubscription;
