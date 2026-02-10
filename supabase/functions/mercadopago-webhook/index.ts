import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-WEBHOOK] ${step}${detailsStr}`);
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
    const body = await req.json();
    logStep("Webhook received", { type: body.type, action: body.action, dataId: body.data?.id });

    // Only process payment notifications
    if (body.type !== "payment") {
      logStep("Ignoring non-payment notification", { type: body.type });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logStep("No payment ID in webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch payment details from Mercado Pago
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!mpResponse.ok) {
      logStep("Error fetching payment from MP", { status: mpResponse.status });
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const payment = await mpResponse.json();
    logStep("Payment details", {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      userId: payment.metadata?.user_id,
      planId: payment.metadata?.plan_id,
    });

    const userId = payment.metadata?.user_id;
    const planId = payment.metadata?.plan_id;

    if (!userId || !planId) {
      logStep("Missing metadata in payment, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const PLAN_MONTHS: Record<string, number> = {
      monthly: 1,
      semiannual: 6,
      annual: 12,
    };

    if (payment.status === "approved") {
      const months = PLAN_MONTHS[planId] || 1;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);

      const { error: updateError } = await supabaseClient
        .from("professionals")
        .update({
          subscription_type: planId,
          subscription_expires_at: expiresAt.toISOString(),
          approval_status: "pending_approval",
        })
        .eq("user_id", userId);

      if (updateError) {
        logStep("Error updating professional via webhook", { error: updateError });
      } else {
        logStep("Professional updated via webhook", { userId, planId, expiresAt: expiresAt.toISOString() });
      }
    } else if (payment.status === "refunded" || payment.status === "cancelled" || payment.status === "charged_back") {
      logStep("Payment refunded/cancelled/charged_back", { status: payment.status, userId });
      // Optionally handle refunds here
    }

    return new Response(JSON.stringify({ received: true }), {
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
