import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get professional record
    const { data: professional, error: profError } = await supabaseClient
      .from('professionals')
      .select('id, subscription_type, subscription_expires_at, approval_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError) throw new Error(`Database error: ${profError.message}`);
    if (!professional) throw new Error("Professional record not found");

    logStep("Professional found", { 
      id: professional.id, 
      plan: professional.subscription_type, 
      expiresAt: professional.subscription_expires_at,
      status: professional.approval_status 
    });

    // Ensure they have an active subscription to cancel
    if (!professional.subscription_expires_at) {
      throw new Error("No active subscription found to cancel");
    }

    const expiresAt = professional.subscription_expires_at;
    const expirationDate = new Date(expiresAt);

    // Check if already expired
    if (expirationDate < new Date()) {
      throw new Error("Subscription has already expired");
    }

    // Check if already pending cancellation
    if (professional.approval_status === 'pending_cancellation') {
      throw new Error("Subscription is already marked for cancellation");
    }

    logStep("Cancelling subscription - will keep access until", { expiresAt });

    // Update professional record - mark as pending_cancellation
    // Keep the existing subscription_expires_at so they retain access until end of paid period
    const { error: updateError } = await supabaseClient
      .from('professionals')
      .update({
        approval_status: 'pending_cancellation',
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
      expires_at: expiresAt
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
