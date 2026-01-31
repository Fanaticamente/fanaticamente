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
    amount: 0.50, // R$ 0,50/mês (TEMPORÁRIO PARA TESTES)
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

const PAYMENT_TIMEOUT = 90000; // 90 seconds for payment processing

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-MERCADOPAGO-PAYMENT] ${step}${detailsStr}`);
};

// Helper function to call Mercado Pago with retry logic
async function callMercadoPagoWithRetry(
  url: string,
  options: RequestInit,
  attempt = 1
): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT);

    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    // Don't retry on 4xx errors (client errors)
    if (response.status >= 400 && response.status < 500) {
      return response;
    }

    // Retry on 5xx errors (server errors)
    if (!response.ok && attempt < 3) {
      logStep(`Mercado Pago server error, retrying (attempt ${attempt}/3)`, { status: response.status });
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      return callMercadoPagoWithRetry(url, options, attempt + 1);
    }

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      throw new Error('Payment request timeout - please try again');
    }

    logStep(`Payment gateway error (attempt ${attempt}/3):`, err.message);

    if (attempt >= 3) {
      throw new Error(`Gateway unavailable after 3 attempts: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    return callMercadoPagoWithRetry(url, options, attempt + 1);
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
    const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID");
    const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");

    // Log credential availability (without exposing values)
    logStep("Checking Mercado Pago credentials", {
      hasAccessToken: !!accessToken,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    if (!clientId || !clientSecret) {
      logStep("Warning: MERCADOPAGO_CLIENT_ID or MERCADOPAGO_CLIENT_SECRET not configured - this may cause payment rejections");
    }

    // Validate access token format
    if (accessToken.startsWith("TEST-") || accessToken.startsWith("APP_USR-")) {
      logStep("Mercado Pago access token verified", { 
        mode: accessToken.startsWith("TEST-") ? "test" : "production" 
      });
    } else {
      logStep("Warning: Unexpected access token format");
    }

    const { planId, token, paymentMethodId, email, identificationType, identificationNumber, installments, deviceId, ipAddress } = await req.json();
    logStep("Request body received", { planId, paymentMethodId, email, identificationType, hasToken: !!token, hasDeviceId: !!deviceId });

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

    // Get client IP from headers (for anti-fraud)
    const clientIp = ipAddress || 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
      req.headers.get("x-real-ip") ||
      "unknown";

    // Criar pagamento via API do Mercado Pago com campos adicionais de anti-fraude
    const paymentBody: Record<string, unknown> = {
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
        // Adicionar dados do pagador para melhorar aprovação
        first_name: user.user_metadata?.full_name?.split(" ")[0] || "Usuario",
        last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "Fanatica",
      },
      // Campos adicionais para anti-fraude
      additional_info: {
        ip_address: clientIp,
        items: [
          {
            id: planId,
            title: plan.name,
            description: `Assinatura ${plan.name} - Fanática`,
            category_id: "services",
            quantity: 1,
            unit_price: plan.amount,
          },
        ],
        payer: {
          first_name: user.user_metadata?.full_name?.split(" ")[0] || "Usuario",
          last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "Fanatica",
          registration_date: user.created_at,
        },
      },
      statement_descriptor: "FANATICA",
      metadata: {
        user_id: user.id,
        plan_id: planId,
        source: "fanatica_app",
      },
      // Capture imediato
      capture: true,
      // Forçar processamento em modo binário (aprovado/rejeitado, sem pending)
      binary_mode: true,
    };

    // Adicionar device_id se disponível (melhora anti-fraude)
    if (deviceId) {
      (paymentBody.additional_info as Record<string, unknown>).payer = {
        ...(paymentBody.additional_info as Record<string, unknown>).payer as Record<string, unknown>,
        device_id: deviceId,
      };
    }

    logStep("Creating Mercado Pago payment with enhanced anti-fraud data", { 
      paymentBody: { ...paymentBody, token: "***" },
      hasDeviceId: !!deviceId,
      clientIp: clientIp.substring(0, 10) + "..."
    });

    const mpResponse = await callMercadoPagoWithRetry("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${planId}-${Date.now()}`,
        // Headers adicionais recomendados pelo Mercado Pago
        "X-Product-Id": "fanatica-subscription",
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();
    logStep("Mercado Pago response", { 
      status: mpResponse.status, 
      paymentStatus: mpData.status, 
      paymentId: mpData.id,
      statusDetail: mpData.status_detail,
      errorMessage: mpData.message,
      errorCause: mpData.cause
    });

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
