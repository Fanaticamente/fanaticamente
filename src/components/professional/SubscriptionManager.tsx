import { useState } from "react";
import { Check, Star, Crown, Zap, AlertTriangle, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface SubscriptionManagerProps {
  professionalId: string;
  currentPlan: string;
  expiresAt: string;
  onUpdate: () => void;
}

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 199.90,
    period: "mês",
    months: 1,
    icon: Zap,
  },
  {
    id: "semiannual",
    name: "Semestral",
    price: 1079.90,
    period: "semestre",
    months: 6,
    icon: Star,
    discount: 10,
  },
  {
    id: "annual",
    name: "Anual",
    price: 2038.90,
    period: "ano",
    months: 12,
    icon: Crown,
    discount: 15,
  }
];

const planOrder = ["monthly", "semiannual", "annual"];

const SubscriptionManager = ({ professionalId, currentPlan, expiresAt, onUpdate }: SubscriptionManagerProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlanData = plans.find(p => p.id === currentPlan);
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const availableUpgrades = plans.filter((_, index) => index > currentPlanIndex);
  const expirationDate = new Date(expiresAt);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          is_active: false,
          subscription_type: null,
          subscription_expires_at: null
        })
        .eq('id', professionalId);

      if (error) throw error;

      toast.success("Assinatura cancelada. Seu perfil foi removido do marketplace.");
      setShowCancelDialog(false);
      onUpdate();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedUpgrade) {
      toast.error("Selecione um plano");
      return;
    }

    setIsProcessing(true);
    try {
      const plan = plans.find(p => p.id === selectedUpgrade);
      if (!plan) return;

      let expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.months);

      const { error } = await supabase
        .from('professionals')
        .update({
          subscription_type: selectedUpgrade,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', professionalId);

      if (error) throw error;

      toast.success(`Upgrade para ${plan.name} realizado com sucesso!`);
      setShowUpgradeDialog(false);
      setSelectedUpgrade(null);
      onUpdate();
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Erro ao fazer upgrade");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentPlanData) return null;

  const PlanIcon = currentPlanData.icon;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-xl text-card-foreground mb-4">
        Minha Assinatura
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-therapy/20">
          <PlanIcon className="w-6 h-6 text-therapy" />
        </div>
        <div>
          <p className="font-bold text-card-foreground text-lg">
            Plano {currentPlanData.name}
          </p>
          <p className="text-muted-foreground text-sm">
            R$ {currentPlanData.price.toFixed(2).replace('.', ',')} / {currentPlanData.period}
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-card-foreground">Válido até: </span>
          {format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="flex gap-3">
        {availableUpgrades.length > 0 && (
          <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
            <DialogTrigger asChild>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform">
                <ChevronUp className="w-4 h-4" />
                Fazer Upgrade
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-card-foreground">
                  Upgrade de Plano
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Escolha um plano superior para obter mais benefícios
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 mt-4">
                {availableUpgrades.map((plan) => {
                  const UpgradeIcon = plan.icon;
                  const isSelected = selectedUpgrade === plan.id;
                  
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedUpgrade(plan.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? "border-therapy bg-therapy/10" 
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UpgradeIcon className={`w-5 h-5 ${isSelected ? "text-therapy" : "text-muted-foreground"}`} />
                        <div className="flex-1">
                          <p className="font-bold text-card-foreground">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {plan.price.toFixed(2).replace('.', ',')} / {plan.period}
                            {plan.discount && (
                              <span className="ml-2 text-green-500">-{plan.discount}%</span>
                            )}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-therapy bg-therapy" : "border-muted-foreground"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-therapy-foreground" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={!selectedUpgrade || isProcessing}
                className="w-full mt-4 py-3 bg-therapy text-therapy-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {isProcessing ? "Processando..." : "Confirmar Upgrade"}
              </button>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogTrigger asChild>
            <button className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-destructive/20 hover:text-destructive transition-colors">
              Cancelar Assinatura
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancelar Assinatura
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Tem certeza que deseja cancelar sua assinatura?
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mt-4">
              <p className="text-sm text-destructive">
                <strong>Atenção:</strong> Ao cancelar, seu perfil será removido do marketplace e você não receberá novos agendamentos.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium"
              >
                Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium disabled:opacity-50"
              >
                {isProcessing ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SubscriptionManager;