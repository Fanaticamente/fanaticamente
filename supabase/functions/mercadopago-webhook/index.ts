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

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    logStep("MERCADOPAGO_WEBHOOK_SECRET not configured, skipping signature verification");
    return true; // Allow if not configured (dev mode)
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logStep("Missing x-signature or x-request-id headers");
    return false;
  }

  // Parse x-signature: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=", 2);
    parts[key.trim()] = value.trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    logStep("Invalid x-signature format", { xSignature });
    return false;
  }

  // Get data.id from query params (MP sends it as query param)
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || "";

  // Build the manifest string per MP docs
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = computedHash === v1;
  if (!isValid) {
    logStep("Signature mismatch", { expected: v1, computed: computedHash });
  }
  return isValid;
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
    const bodyText = await req.text();

    // Verify webhook signature
    const isValid = await verifySignature(req, bodyText);
    if (!isValid) {
      logStep("Invalid webhook signature, rejecting");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = JSON.parse(bodyText);
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
