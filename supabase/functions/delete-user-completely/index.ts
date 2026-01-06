import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller has admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized - admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user ID to delete from request body
    const { userId, adminPassword } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin password
    if (adminPassword !== "fanatica2025") {
      return new Response(JSON.stringify({ error: "Invalid admin password" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[delete-user-completely] Deleting user ${userId} requested by admin ${callerUser.id}`);

    // Delete in order to respect foreign key constraints:

    // 1. Delete admin messages related to the professional (if any)
    const { data: profData } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profData) {
      await supabaseAdmin
        .from("admin_messages")
        .delete()
        .eq("professional_id", profData.id);

      // Delete professional availability
      await supabaseAdmin
        .from("professional_availability")
        .delete()
        .eq("professional_id", profData.id);

      // Delete appointments where this professional is involved
      await supabaseAdmin
        .from("appointments")
        .delete()
        .eq("professional_id", profData.id);
    }

    // 2. Delete appointments where this user is the patient
    await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("user_id", userId);

    // 3. Delete professional record
    await supabaseAdmin
      .from("professionals")
      .delete()
      .eq("user_id", userId);

    // 4. Delete user roles
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 5. Delete profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    // 6. Finally, delete the auth user (this is the most important step)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("[delete-user-completely] Error deleting auth user:", deleteAuthError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user: " + deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[delete-user-completely] User ${userId} deleted completely`);

    return new Response(JSON.stringify({ success: true, message: "User deleted completely" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[delete-user-completely] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
