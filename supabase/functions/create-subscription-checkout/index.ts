import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe price IDs for professional subscription plans
// Monthly is set to R$0.01 for testing purposes
const PRICE_IDS = {
  monthly: "price_1Sv5W1FTvMjF2L2n2sPaXH3J", // R$0.01 test price
  semiannual: "price_1Sm5JoFTvMjF2L2nEsTMj81S", // R$1.079,90 (needs update to 6-month single charge)
  annual: "price_1Sm5JyFTvMjF2L2n6AOTYusI", // R$2.038,90/year
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planId } = await req.json();
    logStep("Plan requested", { planId });

    if (!planId || !PRICE_IDS[planId as keyof typeof PRICE_IDS]) {
      throw new Error("Invalid plan ID");
    }

    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];
    logStep("Price ID resolved", { priceId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create checkout session for embedded checkout with 180-day free trial
    // Note: PIX is not supported for recurring subscriptions, only card payments
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded",
      subscription_data: {
        trial_period_days: 180,
      },
      return_url: `${origin}/profissional?checkout=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    logStep("Embedded checkout session created", { sessionId: session.id, clientSecret: session.client_secret ? "present" : "missing" });

    return new Response(JSON.stringify({ 
      clientSecret: session.client_secret,
      sessionId: session.id 
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
