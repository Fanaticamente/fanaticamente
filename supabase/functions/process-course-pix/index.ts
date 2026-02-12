import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEMBERSHIP_PRICE = 49.90;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-COURSE-PIX] ${step}${detailsStr}`);
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

    const accessToken = Deno.env.get("MERCADOPAGO_COURSES_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_COURSES_ACCESS_TOKEN is not configured");

    const { purchaseType, courseId, coursePrice, email } = await req.json();
    logStep("Request received", { purchaseType, courseId, coursePrice });

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
    const authHeader = req.headers.get("Authorization")!;
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

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${user.id}-pix-${purchaseType}-${courseId || 'membership'}-${Date.now()}`,
    };

    logStep("Creating PIX payment", { amount });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers,
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();
    logStep("MP response", { status: mpResponse.status, paymentStatus: mpData.status, paymentId: mpData.id });

    if (!mpResponse.ok) throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);

    // PIX payments start as "pending" - we return the QR code data
    const pixData = mpData.point_of_interaction?.transaction_data;

    return new Response(JSON.stringify({
      status: mpData.status,
      payment_id: mpData.id,
      qr_code: pixData?.qr_code,
      qr_code_base64: pixData?.qr_code_base64,
      ticket_url: pixData?.ticket_url,
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
