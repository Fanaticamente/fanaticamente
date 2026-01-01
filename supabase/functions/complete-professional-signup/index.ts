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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as Payload;
    const crp = (payload?.crp ?? "").trim();

    if (!crp) {
      return new Response(JSON.stringify({ error: "CRP is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CRP_REGEX.test(crp)) {
      return new Response(JSON.stringify({ error: "Invalid CRP format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, serviceRoleKey);

    // Ensure profile exists + has the latest signup data
    if (payload.profile && Object.keys(payload.profile).length > 0) {
      const { error: profileError } = await service
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            ...payload.profile,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        return new Response(JSON.stringify({ error: "Failed to update profile" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create professional row if missing
    const { data: existingProfessional } = await service
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingProfessional) {
      const { error: professionalError } = await service.from("professionals").insert({
        user_id: user.id,
        crp,
        is_active: false,
        is_verified: false,
      });

      if (professionalError) {
        return new Response(JSON.stringify({ error: "Failed to create professional" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Ensure role exists
    const { error: roleError } = await service
      .from("user_roles")
      .upsert(
        {
          user_id: user.id,
          role: "professional",
        },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
