import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const displayEmailFor = (user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) => {
  const metadataEmail = user.user_metadata?.display_email;
  if (typeof metadataEmail === "string" && metadataEmail.trim()) {
    return metadataEmail.trim().toLowerCase();
  }

  const email = (user.email || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;

  const local = email.slice(0, at).replace(/\+(fan|pro)$/i, "");
  const domain = email.slice(at + 1);
  return `${local}@${domain}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request is from an authenticated professional
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is a professional or admin
    const { data: professional } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "developer"])
      .maybeSingle();

    if (!professional && !adminRole) {
      return new Response(
        JSON.stringify({ error: "Not authorized - must be a professional or admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { userIds, search } = body;

    // Mode 1: search by email (partial match)
    if (search && typeof search === "string") {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
      if (listError) throw listError;

      const searchLower = search.toLowerCase();
      const matched = (authUsers?.users || [])
        .map(u => ({ id: u.id, email: displayEmailFor(u) }))
        .filter(u => u.email && u.email.toLowerCase().includes(searchLower))
        .slice(0, 10)
        .map(u => ({ id: u.id, email: u.email }));

      return new Response(
        JSON.stringify({ users: matched }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode 2: batch lookup by userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ emails: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch emails from auth.users using admin client
    const emails: Record<string, string> = {};
    
    for (const userId of userIds) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userError && userData?.user?.email) {
        emails[userId] = displayEmailFor(userData.user);
      }
    }

    return new Response(
      JSON.stringify({ emails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
