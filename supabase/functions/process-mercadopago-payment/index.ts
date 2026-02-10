import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLANS: Record<string, { name: string; amount: number; months: number }> = {
  monthly: {
    name: "Plano Mensal",
    amount: 1.00,
    months: 1,
  },
  semiannual: {
    name: "Plano Semestral",
    amount: 1079.90,
    months: 6,
  },
  annual: {
    name: "Plano Anual",
    amount: 2038.90,
    months: 12,
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-MERCADOPAGO-PAYMENT] ${step}${detailsStr}`);
};

async function callMercadoPagoWithRetry(
  url: string,
  options: RequestInit,
  attempt = 1
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status >= 500 && attempt < 3) {
      logStep(`MP server error, retrying (attempt ${attempt}/3)`, { status: response.status });
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      return callMercadoPagoWithRetry(url, options, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < 3) {
      logStep(`Network error, retrying (attempt ${attempt}/3)`);
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      return callMercadoPagoWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
}

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

    const { planId, token, paymentMethodId, issuerId, installments, email, deviceId, clientIp } = await req.json();
    logStep("Request received", { planId, paymentMethodId, issuerId, installments, hasToken: !!token, hasDeviceId: !!deviceId });

    if (!planId || !PLANS[planId]) {
      throw new Error("Invalid plan ID");
    }
    if (!token) {
      throw new Error("Card token is required");
    }

    const plan = PLANS[planId];

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(userToken);
    const user = userData.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Build payment body
    const paymentBody: Record<string, unknown> = {
      transaction_amount: plan.amount,
      token: token,
      description: `${plan.name} - Fanática`,
      installments: installments || 1,
      payment_method_id: paymentMethodId,
      statement_descriptor: "FANATICA",
      binary_mode: true,
      payer: {
        email: email || user.email,
      },
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_name: plan.name,
      },
    };

    if (issuerId) {
      paymentBody.issuer_id = issuerId;
    }

    // Anti-fraud headers
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${user.id}-${planId}-${Date.now()}`,
    };

    if (deviceId) {
      headers["X-meli-session-id"] = deviceId;
    }

    logStep("Creating payment", { amount: plan.amount, paymentMethodId });

    const mpResponse = await callMercadoPagoWithRetry(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers,
        body: JSON.stringify(paymentBody),
      }
    );

    const mpData = await mpResponse.json();
    logStep("MP response", { status: mpResponse.status, paymentStatus: mpData.status, paymentId: mpData.id });

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    // If payment approved, update professional subscription
    if (mpData.status === "approved") {
      logStep("Payment approved, updating subscription");

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.months);

      const { error: updateError } = await supabaseClient
        .from("professionals")
        .update({
          subscription_type: planId,
          subscription_expires_at: expiresAt.toISOString(),
          approval_status: "pending_approval",
        })
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating professional", { error: updateError });
        // Payment succeeded but DB update failed - log but don't fail
      } else {
        logStep("Professional subscription updated", { expiresAt: expiresAt.toISOString() });
      }
    }

    return new Response(JSON.stringify({
      status: mpData.status,
      status_detail: mpData.status_detail,
      payment_id: mpData.id,
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
