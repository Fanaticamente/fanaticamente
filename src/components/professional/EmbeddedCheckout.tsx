import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

// Stripe publishable key - using test key for development
const stripePromise = loadStripe("pk_test_51Sm53AFTvMjF2L2noilMRVBCsoxgvzUvYMcFfxzPxhb6k5ZgdF6qJHHIY5ijZKLKfyghHVIIQHD8dY5zrPkxHJe600dWXNVLAE");

interface EmbeddedCheckoutProps {
  planId: string;
  planName: string;
  onBack: () => void;
}

const EmbeddedCheckoutComponent = ({ planId, planName, onBack }: EmbeddedCheckoutProps) => {
  const fetchClientSecret = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
      body: { planId }
    });

    if (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }

    if (!data?.clientSecret) {
      throw new Error("No client secret received");
    }

    return data.clientSecret;
  }, [planId]);

  const options = { fetchClientSecret };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-display text-xl text-card-foreground">
            Pagamento - {planName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete seu pagamento de forma segura
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout className="min-h-[400px]" />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};

export default EmbeddedCheckoutComponent;
