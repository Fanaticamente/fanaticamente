import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MONTHS: Record<string, number> = {
  monthly: 1,
  semiannual: 6,
  annual: 12,
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

    const { planId, token, paymentMethodId, issuerId, installments, email, deviceId, clientIp, couponCode } = await req.json();
    logStep("Request received", { planId, paymentMethodId, issuerId, installments, hasToken: !!token, hasDeviceId: !!deviceId, couponCode });

    if (!planId || !PLAN_MONTHS[planId]) {
      throw new Error("Invalid plan ID");
    }
    if (!token) {
      throw new Error("Card token is required");
    }

    // Load plan from DB (admin-editable source of truth)
    const { data: planRow, error: planErr } = await supabaseClient
      .from("subscription_plans")
      .select("plan_id, name, price, is_active")
      .eq("plan_id", planId)
      .maybeSingle();
    if (planErr || !planRow) throw new Error("Plan not found");
    if (!planRow.is_active) throw new Error("Este plano não está mais disponível");
    const plan = {
      name: `Plano ${planRow.name}`,
      amount: Number(planRow.price),
      months: PLAN_MONTHS[planId],
    };
    logStep("Plan loaded from DB", plan);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(userToken);
    const user = userData.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Server-side coupon validation & price recalculation (source of truth)
    let finalAmount = plan.amount;
    let appliedCoupon: { id: string; discount: number; final: number; original: number } | null = null;

    if (couponCode && typeof couponCode === "string") {
      const code = couponCode.trim().toUpperCase();
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (couponError) logStep("Coupon lookup error", { error: couponError });
      if (!coupon) throw new Error("Cupom inválido");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Cupom expirado");
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) throw new Error("Cupom esgotado");
      if (coupon.applicable_to !== "all" && coupon.applicable_to !== "subscription") throw new Error("Cupom não aplicável a este plano");
      if (coupon.min_amount && plan.amount < Number(coupon.min_amount)) throw new Error("Valor abaixo do mínimo do cupom");

      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = plan.amount * (Number(coupon.discount_value) / 100);
      } else {
        discount = Math.min(Number(coupon.discount_value), plan.amount);
      }
      finalAmount = Math.max(plan.amount - discount, 0);
      // Mercado Pago requires a minimum charge; enforce R$ 0.50 minimum
      if (finalAmount < 0.5) finalAmount = 0.5;
      finalAmount = Math.round(finalAmount * 100) / 100;
      appliedCoupon = { id: coupon.id, discount, final: finalAmount, original: plan.amount };
      logStep("Coupon applied server-side", appliedCoupon);
    }

    // Build payment body
    const paymentBody: Record<string, unknown> = {
      transaction_amount: finalAmount,
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
        coupon_code: appliedCoupon ? couponCode : null,
        original_amount: plan.amount,
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

      // Register coupon usage server-side
      if (appliedCoupon) {
        const { error: usageError } = await supabaseClient.from("coupon_usage").insert({
          coupon_id: appliedCoupon.id,
          user_id: user.id,
          original_amount: appliedCoupon.original,
          discount_amount: appliedCoupon.discount,
          final_amount: appliedCoupon.final,
        });
        if (usageError) {
          logStep("Error inserting coupon usage", { error: usageError });
        } else {
          const { data: cur } = await supabaseClient
            .from("coupons")
            .select("current_uses")
            .eq("id", appliedCoupon.id)
            .maybeSingle();
          const newUses = (cur?.current_uses ?? 0) + 1;
          await supabaseClient
            .from("coupons")
            .update({ current_uses: newUses })
            .eq("id", appliedCoupon.id);
          logStep("Coupon usage registered", { couponId: appliedCoupon.id, newUses });
        }
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
