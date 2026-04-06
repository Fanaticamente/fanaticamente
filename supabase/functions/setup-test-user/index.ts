import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add professional role (user role is added by trigger)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id, role: "professional" }, { onConflict: "user_id,role" });

    if (roleError) console.error("Role error:", roleError);

    // Create professional record
    const { error: profError } = await supabaseAdmin
      .from("professionals")
      .upsert({
        user_id,
        crp: "00/99999",
        degree: "Psicologia",
        bio: "Usuário universal de teste com acesso completo.",
        location: "São Paulo, SP",
        specialties: ["Psicologia do Esporte", "Terapia Cognitivo-Comportamental"],
        experience_years: 5,
        hourly_rate: 150,
        is_verified: true,
        is_active: true,
        approval_status: "approved",
        socio_consciente: true,
        subscription_type: "yearly",
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id" });

    if (profError) console.error("Professional error:", profError);

    // Create membership
    const { error: memberError } = await supabaseAdmin
      .from("user_memberships")
      .insert({
        user_id,
        status: "active",
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (memberError) console.error("Membership error:", memberError);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
