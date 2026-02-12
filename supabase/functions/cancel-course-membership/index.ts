import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-COURSE-MEMBERSHIP] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { membershipId } = await req.json();
    if (!membershipId) throw new Error("Membership ID is required");

    // Verify membership belongs to user
    const { data: membership, error: fetchError } = await supabaseClient
      .from("user_memberships")
      .select("*")
      .eq("id", membershipId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !membership) {
      throw new Error("Membership not found");
    }

    if (membership.status === "cancelled") {
      throw new Error("Membership is already cancelled");
    }

    logStep("Membership found", { id: membership.id, payment_method: membership.payment_method });

    // Update membership status to cancelled
    // The user keeps access until expires_at
    const { error: updateError } = await supabaseClient
      .from("user_memberships")
      .update({ status: "cancelled" })
      .eq("id", membershipId);

    if (updateError) throw new Error(`Error cancelling membership: ${updateError.message}`);

    logStep("Membership cancelled successfully", { membershipId, expiresAt: membership.expires_at });

    return new Response(JSON.stringify({
      success: true,
      message: "Assinatura cancelada. Você mantém o acesso até o fim do período.",
      expires_at: membership.expires_at,
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
