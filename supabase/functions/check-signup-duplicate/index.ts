import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, phone, account_type } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await admin.rpc("check_signup_conflict", {
      _email: email ?? "",
      _phone: phone ?? "",
      _account_type: account_type === "pro" ? "pro" : "fan",
    });

    if (error) {
      console.error("check_signup_conflict error:", error);
      // Fail-open: não bloqueia cadastro por falha técnica
      return new Response(JSON.stringify({ email_taken: false, phone_taken: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-signup-duplicate error:", e);
    return new Response(JSON.stringify({ email_taken: false, phone_taken: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
