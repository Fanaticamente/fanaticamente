import { useState } from "react";
import { Check, Star, Crown, Zap, Shield, Gift, Loader2 } from "lucide-react";
import MercadoPagoCardForm from "./MercadoPagoCardForm";
import { useSubscriptionPlans, useSubscriptionSettings } from "@/hooks/useSubscriptionConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionPlansProps {
  professionalId: string;
  onSubscribe: () => void;
}

const planVisuals: Record<string, { icon: any; color: string; bgColor: string }> = {
  monthly:    { icon: Zap,   color: "border-muted-foreground", bgColor: "bg-muted/30" },
  semiannual: { icon: Star,  color: "border-therapy",          bgColor: "bg-therapy/10" },
  annual:     { icon: Crown, color: "border-primary",          bgColor: "bg-primary/10" },
};
const fallbackVisual = { icon: Star, color: "border-therapy", bgColor: "bg-therapy/10" };

const SubscriptionPlans = ({ professionalId, onSubscribe }: SubscriptionPlansProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activatingFree, setActivatingFree] = useState(false);
  const { data: dbPlans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: settings, isLoading: settingsLoading } = useSubscriptionSettings();

  const plans = (dbPlans ?? []).filter(p => p.is_active);

  const handleProceedToCheckout = () => {
    if (!selectedPlan) return;
    setShowCheckout(true);
  };

  const handleBackToPlans = () => {
    setShowCheckout(false);
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    onSubscribe();
  };

  const handleFreeActivation = async () => {
    setActivatingFree(true);
    try {
      // Set a far-future expiration so the dashboard treats them as active.
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      const { error } = await supabase
        .from("professionals")
        .update({
          subscription_type: "free_period",
          subscription_expires_at: expires.toISOString(),
          approval_status: "pending_approval",
        })
        .eq("id", professionalId);
      if (error) throw error;
      toast.success("Cadastro enviado para aprovação!");
      onSubscribe();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao ativar período gratuito. Tente novamente.");
    } finally {
      setActivatingFree(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  if (plansLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-therapy" />
      </div>
    );
  }

  // Free period mode: subscriptions disabled globally
  if (settings && !settings.subscriptions_enabled) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-therapy bg-therapy/10 p-6 text-center">
          <Gift className="w-12 h-12 text-therapy mx-auto mb-3" />
          <h3 className="font-display text-xl text-card-foreground mb-2">
            Período promocional ativo
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {settings.free_period_banner_text}
          </p>
          <button
            onClick={handleFreeActivation}
            disabled={activatingFree}
            className="w-full h-12 px-4 inline-flex items-center justify-center bg-therapy text-therapy-foreground rounded-xl text-sm font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {activatingFree ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar meu perfil gratuitamente"}
          </button>
        </div>
        {settings.reactivation_warning_enabled && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
            ⚠️ {settings.reactivation_warning_text}
          </div>
        )}
      </div>
    );
  }

  if (showCheckout && selectedPlan && selectedPlanData) {
    return (
      <MercadoPagoCardForm
        planId={selectedPlan}
        planName={selectedPlanData.name}
        planPrice={selectedPlanData.price}
        onBack={handleBackToPlans}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      {settings?.reactivation_warning_enabled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ {settings.reactivation_warning_text}
        </div>
      )}
      <div className="grid gap-4">
        {plans.map((plan) => {
          const visual = planVisuals[plan.plan_id] ?? fallbackVisual;
          const PlanIcon = visual.icon;
          const isSelected = selectedPlan === plan.plan_id;

          return (
            <button
              key={plan.plan_id}
              onClick={() => setSelectedPlan(plan.plan_id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                isSelected 
                  ? `${visual.color} ${visual.bgColor} scale-[1.02]` 
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              {plan.is_popular && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-therapy text-therapy-foreground text-xs font-bold rounded-full">
                  MAIS POPULAR
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${visual.bgColor}`}>
                  <PlanIcon className={`w-6 h-6 ${isSelected ? "text-therapy" : "text-muted-foreground"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display text-xl text-card-foreground">
                      {plan.name}
                    </h3>
                    {plan.discount && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold rounded-full">
                        -{plan.discount}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                    <div className="flex items-baseline">
                      <span className="text-sm text-muted-foreground mr-1">R$</span>
                      <span className="text-2xl font-bold text-card-foreground">
                        {Number(plan.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    {plan.original_price && (
                      <span className="text-muted-foreground text-sm line-through">
                        R$ {Number(plan.original_price).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceedToCheckout();
                      }}
                      className="w-full mt-4 h-11 px-3 inline-flex items-center justify-center whitespace-nowrap bg-therapy text-therapy-foreground rounded-lg text-xs font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
                    >
                      Finalizar Pagamento
                    </button>
                  )}
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "border-therapy bg-therapy" : "border-muted-foreground"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-therapy-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <p className="text-muted-foreground text-sm text-center flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
