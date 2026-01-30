import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    const activeSubscriptions = subscriptions.data.filter(
      (sub: { status: string }) => sub.status === "active" || sub.status === "trialing"
    );

    if (activeSubscriptions.length === 0) {
      throw new Error("No active subscription found to cancel");
    }

    // Cancel the subscription at period end (not immediately)
    const subscription = activeSubscriptions[0];
    logStep("Cancelling subscription at period end", { subscriptionId: subscription.id });

    // Use cancel with prorate=false to cancel at end of billing period
    const cancelledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });
    
    // Handle the period end timestamp properly
    const periodEndTimestamp = cancelledSubscription.current_period_end;
    let periodEnd: string;
    
    if (typeof periodEndTimestamp === 'number') {
      periodEnd = new Date(periodEndTimestamp * 1000).toISOString();
    } else {
      // Fallback: set expiration to 30 days from now
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    logStep("Subscription will cancel at period end", { periodEnd, rawTimestamp: periodEndTimestamp });

    // Update professional record - mark as pending_cancellation but keep active
    const { error: updateError } = await supabaseClient
      .from('professionals')
      .update({
        approval_status: 'pending_cancellation',
        subscription_expires_at: periodEnd
        // Keep is_active: true, is_verified: true, subscription_type as-is
      })
      .eq('user_id', user.id);

    if (updateError) {
      logStep("Error updating professional", { error: updateError.message });
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    logStep("Professional record updated - subscription marked for cancellation at period end");

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription will be cancelled at period end",
      expires_at: periodEnd
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
