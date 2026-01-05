import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product IDs from Stripe
const PRODUCT_IDS = {
  monthly: "prod_TjYQWUCgglUJXx",
  semiannual: "prod_TjYQNtTYS9R29f",
  annual: "prod_TjYQAt5VRT8fb6",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PROFESSIONAL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planId = null;
    let subscriptionEnd = null;
    let productId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });

      // Map product ID to plan ID
      for (const [key, value] of Object.entries(PRODUCT_IDS)) {
        if (value === productId) {
          planId = key;
          break;
        }
      }
      logStep("Determined plan", { planId });

      // Check current approval status
      const { data: currentProfessional } = await supabaseClient
        .from('professionals')
        .select('approval_status')
        .eq('user_id', user.id)
        .single();

      const currentStatus = currentProfessional?.approval_status;
      
      // Determine new approval status based on current status
      // If pending_payment or no status, change to pending_approval
      // If already approved, keep approved
      // If needs_correction, keep needs_correction until admin approves
      let newApprovalStatus = currentStatus;
      if (!currentStatus || currentStatus === 'pending_payment') {
        newApprovalStatus = 'pending_approval';
      }

      // Update professionals table with subscription info
      const { error: updateError } = await supabaseClient
        .from('professionals')
        .update({
          subscription_type: planId,
          subscription_expires_at: subscriptionEnd,
          // Only set is_active if already approved by admin
          is_active: currentStatus === 'approved',
          is_verified: currentStatus === 'approved',
          approval_status: newApprovalStatus
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating professional", { error: updateError.message });
      } else {
        logStep("Professional record updated", { newApprovalStatus });
      }
    } else {
      logStep("No active subscription found");
      
      // Deactivate professional if no subscription
      const { error: updateError } = await supabaseClient
        .from('professionals')
        .update({
          is_active: false,
          subscription_type: null,
          subscription_expires_at: null
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error deactivating professional", { error: updateError.message });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_id: planId,
      product_id: productId,
      subscription_end: subscriptionEnd
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
