import { useState, useEffect } from "react";
import { Check, Star, Crown, Zap, AlertTriangle, ChevronUp, RefreshCw, Clock, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SubscriptionPlans from "./SubscriptionPlans";
interface SubscriptionManagerProps {
  professionalId: string;
  currentPlan: string | null;
  expiresAt: string | null;
  approvalStatus: string | null;
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

const SubscriptionManager = ({ 
  professionalId, 
  currentPlan, 
  expiresAt, 
  approvalStatus,
  onUpdate 
}: SubscriptionManagerProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showResubscribeDialog, setShowResubscribeDialog] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCancelled = approvalStatus === 'cancelled';
  const isPendingCancellation = approvalStatus === 'pending_cancellation';
  const isPendingApproval = approvalStatus === 'pending_approval';
  const currentPlanData = currentPlan ? plans.find(p => p.id === currentPlan) : null;
  const currentPlanIndex = currentPlan ? planOrder.indexOf(currentPlan) : -1;
  const availableUpgrades = plans.filter((_, index) => index > currentPlanIndex);
  const expirationDate = expiresAt ? new Date(expiresAt) : null;

  // Countdown state for pending cancellation
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  
  useEffect(() => {
    if (!isPendingCancellation || !expirationDate) return;
    
    const updateCountdown = () => {
      const now = new Date();
      if (isPast(expirationDate)) {
        setTimeRemaining("Expirado");
        return;
      }
      
      const days = differenceInDays(expirationDate, now);
      const hours = differenceInHours(expirationDate, now) % 24;
      const minutes = differenceInMinutes(expirationDate, now) % 60;
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [isPendingCancellation, expirationDate]);

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.info("Abrindo portal de gerenciamento...");
      } else {
        throw new Error("URL do portal não recebida");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Erro ao abrir portal. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      if (data?.success) {
        toast.success("Assinatura cancelada. Você continuará com acesso até o fim do período pago.", {
          duration: 6000,
        });
        setShowCancelDialog(false);
        onUpdate(); // Refresh parent data
      } else {
        throw new Error(data?.error || "Erro ao cancelar assinatura");
      }
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      toast.error(error.message || "Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    // Redirect to Stripe Customer Portal for upgrade
    await handleManageSubscription();
    setShowUpgradeDialog(false);
    setSelectedUpgrade(null);
  };

  // If approval is pending, show analysis message
  if (isPendingApproval) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-card-foreground mb-4">
          Minha Assinatura
        </h2>

        <div className="bg-therapy/10 border border-therapy/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-therapy flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-therapy">Dados e Documentos em Análise</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seu pagamento foi confirmado! Agora nossa equipe está verificando seus dados, documentos e número do CRP. Este processo pode levar até 48 horas úteis.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If subscription is pending cancellation, show countdown card
  if (isPendingCancellation) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-card-foreground mb-4">
          Minha Assinatura
        </h2>

        {/* Cancellation Warning Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-600 dark:text-amber-400">
                Cancelamento Agendado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua assinatura foi cancelada, mas você ainda tem acesso aos benefícios até o fim do período pago.
              </p>
              
              {/* Countdown Timer */}
              <div className="mt-3 p-3 bg-background/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo restante:</span>
                  <span className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                    {timeRemaining}
                  </span>
                </div>
                {expirationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expira em {format(expirationDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reactivate Button */}
        <button
          onClick={handleManageSubscription}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-therapy text-therapy-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          <RefreshCw className="w-5 h-5" />
          {isProcessing ? "Processando..." : "Reativar Assinatura"}
        </button>
        
        <p className="text-xs text-center text-muted-foreground mt-3">
          Você será redirecionado ao portal de pagamento para reativar
        </p>
      </div>
    );
  }

  // If subscription is cancelled, show resubscribe option
  if (isCancelled) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-card-foreground mb-4">
          Escolha seu Plano
        </h2>

        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="font-bold text-destructive">Assinatura Cancelada</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Seu perfil foi removido do marketplace. Assine novamente para reativar seu perfil e receber novos agendamentos.
          </p>
        </div>

        <Dialog open={showResubscribeDialog} onOpenChange={setShowResubscribeDialog}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 py-4 bg-therapy text-therapy-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform">
              <RefreshCw className="w-5 h-5" />
              Reativar Assinatura
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-2xl w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-card-foreground">
                Escolha seu Plano
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Selecione um plano para reativar seu perfil no marketplace
              </DialogDescription>
            </DialogHeader>
            
            <SubscriptionPlans 
              professionalId={professionalId} 
              onSubscribe={() => {
                setShowResubscribeDialog(false);
                onUpdate();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If approved but no plan data (edge case: subscription active but subscription_type not set)
  const isApproved = approvalStatus === 'approved';
  if (isApproved && !currentPlanData && expirationDate) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-card-foreground mb-4">
          Minha Assinatura
        </h2>

        <div className="bg-therapy/10 border border-therapy/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-therapy flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-therapy">Assinatura Ativa</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seu perfil está visível no marketplace e você pode receber agendamentos.
              </p>
            </div>
          </div>
        </div>

        {/* Manage Subscription Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              {isProcessing ? "Processando..." : "Gerenciar Assinatura"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuItem 
              onClick={handleManageSubscription}
              className="cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 mr-2 text-therapy" />
              <span>Fazer Upgrade</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowCancelDialog(true)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              <span>Cancelar Assinatura</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="bg-card border-border rounded-2xl w-[calc(100%-2rem)] max-w-lg">
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
                <strong>Atenção:</strong> Ao cancelar, você continuará com acesso até o fim do período pago. Após isso, seu perfil será removido do marketplace.
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
    );
  }

  if (!currentPlanData) return null;

  const PlanIcon = currentPlanData.icon;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-display text-2xl text-card-foreground mb-4">
        Minha Assinatura
      </h2>

      {/* Active subscription status */}
      <div className="bg-therapy/10 border border-therapy/30 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-therapy flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-therapy">Assinatura Ativa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Seu perfil está visível no marketplace e você pode receber agendamentos.
            </p>
          </div>
        </div>
      </div>

      {/* Plan info */}
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

      {/* Manage Subscription Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <Settings className="w-4 h-4" />
            {isProcessing ? "Processando..." : "Gerenciar Assinatura"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          {availableUpgrades.length > 0 && (
            <DropdownMenuItem 
              onClick={() => setShowUpgradeDialog(true)}
              className="cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 mr-2 text-therapy" />
              <span>Fazer Upgrade</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => setShowCancelDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            <span>Cancelar Assinatura</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upgrade Dialog */}
      {availableUpgrades.length > 0 && (
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="bg-card border-border rounded-2xl w-[calc(100%-2rem)] max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-card-foreground">
                Upgrade de Plano
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Escolha um plano superior. O upgrade passará a valer após o término do período atual.
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

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-card border-border rounded-2xl w-[calc(100%-2rem)] max-w-lg">
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
              <strong>Atenção:</strong> Ao cancelar, você continuará com acesso até o fim do período pago. Após isso, seu perfil será removido do marketplace.
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
  );
};

export default SubscriptionManager;
