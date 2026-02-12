import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEMBERSHIP_PRICE = 49.90;
const PAYMENT_TIMEOUT = 90000; // 90 seconds for async PIX payments

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-COURSE-PIX] ${step}${detailsStr}`);
};

async function callMercadoPagoWithRetry(
  url: string,
  options: RequestInit,
  attempt = 1
): Promise<any> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(PAYMENT_TIMEOUT),
    });

    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      const textResponse = await response.text();
      logStep("Gateway returned non-JSON", { status: response.status, body: textResponse.substring(0, 200) });
      throw new Error("Gateway retornou resposta inválida. Tente novamente.");
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      logStep("Failed to parse response as JSON", { parseError });
      throw new Error("Gateway retornou resposta malformada.");
    }

    // Don't retry 4xx errors
    if (response.status >= 400 && response.status < 500) {
      logStep("Client error (no retry)", { status: response.status, data });
      throw new Error(`Mercado Pago error: ${data.message || JSON.stringify(data)}`);
    }

    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    // Don't retry client errors
    if (error.message?.includes("Mercado Pago error") || error.message?.includes("Gateway retornou")) {
      throw error;
    }

    logStep(`Payment gateway error (attempt ${attempt}/3)`, { message: error.message });

    if (attempt >= 3) {
      throw new Error(`Gateway indisponível após 3 tentativas: ${error.message}`);
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

    const accessToken = Deno.env.get("MERCADOPAGO_COURSES_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_COURSES_ACCESS_TOKEN is not configured");

    const { purchaseType, courseId, coursePrice, email } = await req.json();
    logStep("Request received", { purchaseType, courseId, coursePrice, email });

    if (!purchaseType || !["course", "membership"].includes(purchaseType)) {
      throw new Error("Invalid purchase type");
    }

    let amount: number;
    let description: string;

    if (purchaseType === "membership") {
      amount = MEMBERSHIP_PRICE;
      description = "Assinatura Mensal FanatiClass";
    } else {
      if (!courseId || !coursePrice || coursePrice <= 0) throw new Error("Course ID and price required");
      amount = coursePrice;
      description = "Curso Avulso - FanatiClass";
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(userToken);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Create PIX payment
    const paymentBody = {
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: { email: email || user.email },
      metadata: {
        user_id: user.id,
        purchase_type: purchaseType,
        course_id: courseId || null,
      },
    };

    const idempotencyKey = `${user.id}-pix-${purchaseType}-${courseId || 'membership'}-${Date.now()}`;

    logStep("Creating PIX payment", { amount, idempotencyKey });

    const mpData = await callMercadoPagoWithRetry(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(paymentBody),
      }
    );

    logStep("MP response received", {
      status: mpData.status,
      paymentId: mpData.id,
      hasPointOfInteraction: !!mpData.point_of_interaction,
      hasTransactionData: !!mpData.point_of_interaction?.transaction_data,
    });

    // Extract QR code data defensively
    const pixInfo = mpData.point_of_interaction?.transaction_data;
    const qrCode = pixInfo?.qr_code;
    const qrCodeBase64 = pixInfo?.qr_code_base64;

    if (!qrCode) {
      logStep("QR code missing from response", { responseKeys: Object.keys(mpData), pixInfo });
      throw new Error("QR Code não gerado pelo gateway. Tente novamente.");
    }

    logStep("PIX QR code generated successfully", { paymentId: mpData.id, qrCodeLength: qrCode.length });

    return new Response(JSON.stringify({
      status: mpData.status,
      payment_id: mpData.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64 || "",
      ticket_url: pixInfo?.ticket_url || "",
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
