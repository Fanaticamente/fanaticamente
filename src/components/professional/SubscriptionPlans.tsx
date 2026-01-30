import { useState } from "react";
import { Check, Star, Crown, Zap, Shield } from "lucide-react";
import MercadoPagoCardForm from "./MercadoPagoCardForm";

interface SubscriptionPlansProps {
  professionalId: string;
  onSubscribe: () => void;
}

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 0.50, // R$0,50/mês (TEMPORÁRIO PARA TESTES)
    originalPrice: null,
    discount: null,
    period: "mês",
    icon: Zap,
    color: "border-muted-foreground",
    bgColor: "bg-muted/30",
    features: [
      "Perfil visível no marketplace",
      "Sistema de agendamento",
      "Painel de métricas básico",
      "Suporte por email"
    ]
  },
  {
    id: "semiannual",
    name: "Semestral",
    price: 1079.90,
    originalPrice: 1199.40,
    discount: 10,
    period: "semestre",
    icon: Star,
    color: "border-therapy",
    bgColor: "bg-therapy/10",
    popular: true,
    features: [
      "Tudo do plano Mensal",
      "Destaque no ranking de busca",
      "Selo de profissional destaque",
      "Suporte prioritário"
    ]
  },
  {
    id: "annual",
    name: "Anual",
    price: 2038.90,
    originalPrice: 2398.80,
    discount: 15,
    period: "ano",
    icon: Crown,
    color: "border-primary",
    bgColor: "bg-primary/10",
    features: [
      "Tudo do plano Semestral",
      "Posição premium no marketplace",
      "Acesso antecipado a novidades",
      "Mentoria exclusiva trimestral"
    ]
  }
];

const SubscriptionPlans = ({ professionalId, onSubscribe }: SubscriptionPlansProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

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

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

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
      <div className="grid gap-4">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                isSelected 
                  ? `${plan.color} ${plan.bgColor} scale-[1.02]` 
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-therapy text-therapy-foreground text-xs font-bold rounded-full">
                  MAIS POPULAR
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${plan.bgColor}`}>
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
                        {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    {plan.originalPrice && (
                      <span className="text-muted-foreground text-sm line-through">
                        R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
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

                  {/* Botão dentro do card selecionado */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceedToCheckout();
                      }}
                      className="w-full mt-4 py-5 bg-therapy text-therapy-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
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
