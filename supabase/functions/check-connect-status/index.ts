import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT-STATUS] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Get professional data
    const { data: professional, error: professionalError } = await supabaseClient
      .from("professionals")
      .select("id, stripe_account_id, stripe_account_status")
      .eq("user_id", user.id)
      .single();

    if (professionalError || !professional) {
      throw new Error("Professional profile not found");
    }

    if (!professional.stripe_account_id) {
      return new Response(JSON.stringify({ 
        connected: false, 
        status: "not_created" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check the account status in Stripe
    const account = await stripe.accounts.retrieve(professional.stripe_account_id);
    logStep("Account retrieved", { 
      accountId: account.id, 
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled 
    });

    let status = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      status = "active";
    } else if (account.details_submitted) {
      status = "pending_verification";
    }

    // Update status in database if changed
    if (status !== professional.stripe_account_status) {
      await supabaseClient
        .from("professionals")
        .update({ stripe_account_status: status })
        .eq("id", professional.id);
      logStep("Status updated in database", { status });
    }

    return new Response(JSON.stringify({ 
      connected: status === "active",
      status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
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
