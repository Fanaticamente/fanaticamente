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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

    const userId = callerUser.id;
    console.log(`[delete-own-account] Deleting user ${userId} (self)`);

    // Get professional id if exists
    const { data: profData } = await supabaseAdmin
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // Best-effort cleanup of all related data. Each table is independent — log errors but continue.
    const safe = async (label: string, p: Promise<any>) => {
      const { error } = await p;
      if (error) console.warn(`[delete-own-account] ${label}:`, error.message);
    };

    if (profData?.id) {
      const pid = profData.id;
      await safe("admin_messages", supabaseAdmin.from("admin_messages").delete().eq("professional_id", pid));
      await safe("professional_availability", supabaseAdmin.from("professional_availability").delete().eq("professional_id", pid));
      await safe("professional_weekly_availability", supabaseAdmin.from("professional_weekly_availability").delete().eq("professional_id", pid));
      await safe("google_calendar_blocks", supabaseAdmin.from("google_calendar_blocks").delete().eq("professional_id", pid));
      await safe("professional_google_calendar", supabaseAdmin.from("professional_google_calendar").delete().eq("professional_id", pid));
      await safe("appointments(prof)", supabaseAdmin.from("appointments").delete().eq("professional_id", pid));
      await safe("appointment_disputes(prof)", supabaseAdmin.from("appointment_disputes").delete().eq("professional_id", pid));
      await safe("session_receipts(prof)", supabaseAdmin.from("session_receipts").delete().eq("professional_id", pid));
      await safe("case_reviews", supabaseAdmin.from("case_reviews").delete().eq("professional_id", pid));
      await safe("clinical_notes", supabaseAdmin.from("clinical_notes").delete().eq("professional_id", pid));
      await safe("clinical_observations", supabaseAdmin.from("clinical_observations").delete().eq("professional_id", pid));
      await safe("therapeutic_plans", supabaseAdmin.from("therapeutic_plans").delete().eq("professional_id", pid));
      await safe("receipt_templates", supabaseAdmin.from("receipt_templates").delete().eq("professional_id", pid));
      await safe("reference_library", supabaseAdmin.from("reference_library").delete().eq("professional_id", pid));
    }

    // User-side data
    await safe("appointments(user)", supabaseAdmin.from("appointments").delete().eq("user_id", userId));
    await safe("emotion_entries", supabaseAdmin.from("emotion_entries").delete().eq("user_id", userId));
    await safe("emotional_lineups", supabaseAdmin.from("emotional_lineups").delete().eq("user_id", userId));
    await safe("match_expectations", supabaseAdmin.from("match_expectations").delete().eq("user_id", userId));
    await safe("user_notifications", supabaseAdmin.from("user_notifications").delete().eq("user_id", userId));
    await safe("push_subscriptions", supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId));
    await safe("user_lesson_progress", supabaseAdmin.from("user_lesson_progress").delete().eq("user_id", userId));
    await safe("user_activity_completion", supabaseAdmin.from("user_activity_completion").delete().eq("user_id", userId));
    await safe("user_course_access", supabaseAdmin.from("user_course_access").delete().eq("user_id", userId));
    await safe("user_memberships", supabaseAdmin.from("user_memberships").delete().eq("user_id", userId));
    await safe("coupon_usage", supabaseAdmin.from("coupon_usage").delete().eq("user_id", userId));
    await safe("notification_events", supabaseAdmin.from("notification_events").delete().eq("user_id", userId));
    await safe("notification_logs", supabaseAdmin.from("notification_logs").delete().eq("user_id", userId));

    await safe("professionals", supabaseAdmin.from("professionals").delete().eq("user_id", userId));
    await safe("user_roles", supabaseAdmin.from("user_roles").delete().eq("user_id", userId));
    await safe("profiles", supabaseAdmin.from("profiles").delete().eq("user_id", userId));

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-own-account] Error deleting auth user:", deleteAuthError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user: " + deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[delete-own-account] User ${userId} deleted completely`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[delete-own-account] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});