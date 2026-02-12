import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEMBERSHIP_PRICE = 49.90;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-COURSE-PAYMENT] ${step}${detailsStr}`);
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

    const accessToken = Deno.env.get("MERCADOPAGO_COURSES_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_COURSES_ACCESS_TOKEN is not configured");

    const { purchaseType, courseId, coursePrice, token, paymentMethodId, installments, email, deviceId } = await req.json();
    logStep("Request received", { purchaseType, courseId, coursePrice, paymentMethodId });

    if (!token) throw new Error("Card token is required");
    if (!purchaseType || !["course", "membership"].includes(purchaseType)) {
      throw new Error("Invalid purchase type");
    }

    // Determine amount and description
    let amount: number;
    let description: string;

    if (purchaseType === "membership") {
      amount = MEMBERSHIP_PRICE;
      description = "Assinatura Mensal FanatiClass";
    } else {
      if (!courseId || !coursePrice || coursePrice <= 0) throw new Error("Course ID and price required");
      amount = coursePrice;
      description = `Curso Avulso - FanatiClass`;
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(userToken);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Build payment body
    const paymentBody: Record<string, unknown> = {
      transaction_amount: amount,
      token,
      description,
      installments: installments || 1,
      payment_method_id: paymentMethodId,
      statement_descriptor: "FANATICLASS",
      binary_mode: true,
      payer: { email: email || user.email },
      metadata: {
        user_id: user.id,
        purchase_type: purchaseType,
        course_id: courseId || null,
      },
    };

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${user.id}-${purchaseType}-${courseId || 'membership'}-${Date.now()}`,
    };
    if (deviceId) headers["X-meli-session-id"] = deviceId;

    logStep("Creating payment", { amount, purchaseType });

    const mpResponse = await callMercadoPagoWithRetry(
      "https://api.mercadopago.com/v1/payments",
      { method: "POST", headers, body: JSON.stringify(paymentBody) }
    );

    const mpData = await mpResponse.json();
    logStep("MP response", { status: mpResponse.status, paymentStatus: mpData.status, paymentId: mpData.id });

    if (!mpResponse.ok) throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);

    // If approved, grant access
    if (mpData.status === "approved") {
      logStep("Payment approved, granting access");

      if (purchaseType === "membership") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const { error: membershipError } = await supabaseClient
          .from("user_memberships")
          .insert({
            user_id: user.id,
            status: "active",
            payment_method: "mercadopago_card",
            mercadopago_payment_id: String(mpData.id),
            expires_at: expiresAt.toISOString(),
          });

        if (membershipError) logStep("Error inserting membership", { error: membershipError });
        else logStep("Membership created", { expiresAt: expiresAt.toISOString() });
      } else {
        const { error: accessError } = await supabaseClient
          .from("user_course_access")
          .insert({
            user_id: user.id,
            course_id: courseId,
            access_type: "purchase",
            payment_method: "mercadopago_card",
            mercadopago_payment_id: String(mpData.id),
          });

        if (accessError) logStep("Error inserting course access", { error: accessError });
        else logStep("Course access granted");
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
