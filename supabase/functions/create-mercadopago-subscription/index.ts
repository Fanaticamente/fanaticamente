import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Planos profissionais com configuração para Mercado Pago
const PLANS = {
  monthly: {
    name: "Plano Mensal",
    amount: 20.00, // R$ 20,00/mês
    frequency: 1,
    frequency_type: "months",
  },
  semiannual: {
    name: "Plano Semestral",
    amount: 1079.90, // R$ 1.079,90 (6 meses)
    frequency: 6,
    frequency_type: "months",
  },
  annual: {
    name: "Plano Anual",
    amount: 2038.90, // R$ 2.038,90/ano
    frequency: 12,
    frequency_type: "months",
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MERCADOPAGO-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }
    logStep("Mercado Pago access token verified");

    const { planId } = await req.json();
    logStep("Plan requested", { planId });

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      throw new Error("Invalid plan ID");
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    logStep("Plan resolved", { plan });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Criar assinatura via API do Mercado Pago (preapproval)
    // https://www.mercadopago.com.br/developers/en/reference/subscriptions/_preapproval/post
    const subscriptionBody = {
      reason: plan.name,
      external_reference: user.id,
      payer_email: user.email,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: "BRL",
      },
      back_url: `${origin}/profissional?checkout=success&plan=${planId}`,
    };

    logStep("Creating Mercado Pago subscription", { subscriptionBody });

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionBody),
    });

    const mpData = await mpResponse.json();
    logStep("Mercado Pago response", { status: mpResponse.status, mpData });

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    // A resposta do Mercado Pago inclui um init_point (URL para checkout)
    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      subscription_id: mpData.id,
      status: mpData.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
