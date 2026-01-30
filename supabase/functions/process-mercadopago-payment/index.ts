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
    amount: 5.00,
    frequency: 1,
    frequency_type: "months",
  },
  semiannual: {
    name: "Plano Semestral",
    amount: 1079.90,
    frequency: 6,
    frequency_type: "months",
  },
  annual: {
    name: "Plano Anual",
    amount: 2038.90,
    frequency: 12,
    frequency_type: "months",
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-MERCADOPAGO-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }
    logStep("Mercado Pago access token verified");

    const { planId, token, paymentMethodId, email, identificationType, identificationNumber, installments } = await req.json();
    logStep("Request body received", { planId, paymentMethodId, email, identificationType, hasToken: !!token });

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      throw new Error("Invalid plan ID");
    }

    if (!token) {
      throw new Error("Card token is required");
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    logStep("Plan resolved", { plan });

    const authHeader = req.headers.get("Authorization")!;
    const authToken = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(authToken);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Criar pagamento via API do Mercado Pago
    const paymentBody = {
      transaction_amount: plan.amount,
      token: token,
      description: plan.name,
      installments: installments || 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: email || user.email,
        identification: {
          type: identificationType || "CPF",
          number: identificationNumber,
        },
      },
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    };

    logStep("Creating Mercado Pago payment", { paymentBody: { ...paymentBody, token: "***" } });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();
    logStep("Mercado Pago response", { status: mpResponse.status, paymentStatus: mpData.status, paymentId: mpData.id });

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    // Verificar se o pagamento foi aprovado
    if (mpData.status === "approved") {
      logStep("Payment approved, updating professional subscription");

      // Calcular data de expiração baseada no plano
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + plan.frequency);

      // Atualizar o status do profissional
      const { error: updateError } = await supabaseClient
        .from("professionals")
        .update({
          subscription_type: planId,
          subscription_expires_at: expirationDate.toISOString(),
          approval_status: "pending_approval",
        })
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating professional", { error: updateError });
        throw new Error(`Failed to update professional: ${updateError.message}`);
      }

      logStep("Professional updated successfully");
    }

    return new Response(JSON.stringify({
      success: mpData.status === "approved",
      payment_id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
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
