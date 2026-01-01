const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

type Payload = {
  crp: string;
  profile?: {
    birth_date?: string;
    favorite_club_id?: string;
    city?: string;
    state?: string;
  };
};

const CRP_REGEX = /^\d{2}\/\d{4,6}$/;

Deno.serve(async (req) => {
  console.log("complete-professional-signup: Request received", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    console.log("complete-professional-signup: Auth header present:", !!authHeader);

    if (!authHeader) {
      console.error("complete-professional-signup: Missing Authorization header");
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("complete-professional-signup: Backend not configured", {
        hasUrl: !!supabaseUrl,
        hasAnon: !!anonKey,
        hasService: !!serviceRoleKey,
      });
      return new Response(JSON.stringify({ error: "Backend not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await anon.auth.getUser();

    console.log("complete-professional-signup: User lookup result", {
      userId: user?.id,
      error: userError?.message,
    });

    if (userError || !user) {
      console.error("complete-professional-signup: Unauthorized", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    const crp = (payload?.crp ?? "").trim();

    console.log("complete-professional-signup: Payload received", {
      crp,
      hasProfile: !!payload.profile,
      profile: payload.profile,
    });

    if (!crp) {
      console.error("complete-professional-signup: CRP is required");
      return new Response(JSON.stringify({ error: "CRP is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CRP_REGEX.test(crp)) {
      console.error("complete-professional-signup: Invalid CRP format", crp);
      return new Response(JSON.stringify({ error: "Invalid CRP format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, serviceRoleKey);

    // Ensure profile exists + has the latest signup data
    if (payload.profile && Object.keys(payload.profile).length > 0) {
      console.log("complete-professional-signup: Updating profile for user", user.id);
      
      const { error: profileError } = await service
        .from("profiles")
        .update(payload.profile)
        .eq("user_id", user.id);

      if (profileError) {
        console.error("complete-professional-signup: Profile update failed", profileError);
        return new Response(JSON.stringify({ error: "Failed to update profile", details: profileError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("complete-professional-signup: Profile updated successfully");
    }

    // Create professional row if missing
    const { data: existingProfessional } = await service
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("complete-professional-signup: Existing professional check", {
      exists: !!existingProfessional,
    });

    if (!existingProfessional) {
      console.log("complete-professional-signup: Creating professional record");
      const { error: professionalError } = await service.from("professionals").insert({
        user_id: user.id,
        crp,
        is_active: false,
        is_verified: false,
      });

      if (professionalError) {
        console.error("complete-professional-signup: Professional creation failed", professionalError);
        return new Response(JSON.stringify({ error: "Failed to create professional", details: professionalError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("complete-professional-signup: Professional record created");
    }

    // Ensure role exists
    console.log("complete-professional-signup: Assigning professional role");
    
    // First check if role already exists
    const { data: existingRole } = await service
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "professional")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await service
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "professional",
        });

      if (roleError) {
        console.error("complete-professional-signup: Role assignment failed", roleError);
        return new Response(JSON.stringify({ error: "Failed to assign role", details: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("complete-professional-signup: Professional role assigned");
    } else {
      console.log("complete-professional-signup: Professional role already exists");
    }

    console.log("complete-professional-signup: SUCCESS for user", user.id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("complete-professional-signup: Unexpected error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
