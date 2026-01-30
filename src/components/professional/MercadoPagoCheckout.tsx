import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface MercadoPagoCheckoutProps {
  planId: string;
  planName: string;
  onBack: () => void;
}

const MercadoPagoCheckout = ({ planId, planName, onBack }: MercadoPagoCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mercadopago-subscription', {
        body: { planId }
      });

      if (error) {
        console.error("Error creating subscription:", error);
        toast.error("Erro ao criar assinatura. Tente novamente.");
        return;
      }

      if (data?.init_point) {
        // Redireciona para o checkout do Mercado Pago
        window.location.href = data.init_point;
      } else {
        toast.error("Erro ao obter link de pagamento.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-display text-xl text-card-foreground">
            Pagamento - {planName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete seu pagamento via Mercado Pago
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#009ee3]/10 rounded-full flex items-center justify-center">
            <svg 
              viewBox="0 0 48 48" 
              className="w-10 h-10"
              fill="none"
            >
              <path 
                d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z" 
                fill="#009ee3"
              />
              <path 
                d="M31.5 20.5c0-4.142-3.358-7.5-7.5-7.5s-7.5 3.358-7.5 7.5c0 2.761 1.5 5.179 3.75 6.48v7.02h7.5v-7.02c2.25-1.301 3.75-3.719 3.75-6.48z" 
                fill="white"
              />
            </svg>
          </div>
          
          <div>
            <h3 className="font-display text-lg text-card-foreground">
              Mercado Pago
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você será redirecionado para o ambiente seguro do Mercado Pago para finalizar sua assinatura.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Ao clicar em "Continuar", você será levado ao checkout do Mercado Pago onde poderá escolher sua forma de pagamento preferida (cartão de crédito, Pix, boleto, etc).
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateSubscription}
          disabled={isLoading}
          className="w-full py-4 bg-[#009ee3] hover:bg-[#008bcf] text-white rounded-xl font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Continuar para Pagamento
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          Pagamento seguro processado pelo Mercado Pago
        </p>
      </div>
    </div>
  );
};

export default MercadoPagoCheckout;
