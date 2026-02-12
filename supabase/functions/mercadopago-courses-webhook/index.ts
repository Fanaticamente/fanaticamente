import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-COURSES-WEBHOOK] ${step}${detailsStr}`);
};

async function verifySignature(req: Request): Promise<boolean> {
  const webhookSecret = Deno.env.get("MERCADOPAGO_COURSES_WEBHOOK_SECRET");
  if (!webhookSecret) {
    logStep("MERCADOPAGO_COURSES_WEBHOOK_SECRET not configured, rejecting");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logStep("Missing x-signature or x-request-id headers");
    return false;
  }

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

  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || "";

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

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

    const isValid = await verifySignature(req);
    if (!isValid) {
      logStep("Invalid webhook signature, rejecting");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = JSON.parse(bodyText);
    logStep("Webhook received", { type: body.type, action: body.action, dataId: body.data?.id });

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

    // Fetch payment details using COURSES access token
    const accessToken = Deno.env.get("MERCADOPAGO_COURSES_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_COURSES_ACCESS_TOKEN not configured");
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
      purchaseType: payment.metadata?.purchase_type,
      userId: payment.metadata?.user_id,
      courseId: payment.metadata?.course_id,
    });

    const userId = payment.metadata?.user_id;
    const purchaseType = payment.metadata?.purchase_type;

    if (!userId || !purchaseType) {
      logStep("Missing metadata in payment, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (payment.status === "approved") {
      logStep("Payment approved, granting access", { purchaseType });

      if (purchaseType === "membership") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const { error: membershipError } = await supabaseClient
          .from("user_memberships")
          .insert({
            user_id: userId,
            status: "active",
            payment_method: payment.payment_method_id === "pix" ? "mercadopago_pix" : "mercadopago_card",
            mercadopago_payment_id: String(payment.id),
            expires_at: expiresAt.toISOString(),
          });

        if (membershipError) logStep("Error inserting membership", { error: membershipError });
        else logStep("Membership created via webhook", { expiresAt: expiresAt.toISOString() });
      } else if (purchaseType === "course") {
        const courseId = payment.metadata?.course_id;
        if (!courseId) {
          logStep("Missing course_id in metadata");
        } else {
          const { error: accessError } = await supabaseClient
            .from("user_course_access")
            .insert({
              user_id: userId,
              course_id: courseId,
              access_type: "purchase",
              payment_method: payment.payment_method_id === "pix" ? "mercadopago_pix" : "mercadopago_card",
              mercadopago_payment_id: String(payment.id),
            });

          if (accessError) logStep("Error inserting course access", { error: accessError });
          else logStep("Course access granted via webhook", { courseId });
        }
      }
    } else if (payment.status === "refunded" || payment.status === "cancelled" || payment.status === "charged_back") {
      logStep("Payment refunded/cancelled/charged_back via webhook", { status: payment.status, userId });
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
