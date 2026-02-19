import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await supabaseUser.auth.getClaims(token);
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const hasPermission = rolesData?.some((r) => ["admin", "developer"].includes(r.role));
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, message, type = "info", link, target_user_id, target_club_id } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!oneSignalAppId || !oneSignalRestApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "OneSignal not configured", push_sent: 0, push_failed: 0 }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine target user IDs for logging / filtering
    let targetUserIds: string[] = [];
    let oneSignalPayload: Record<string, unknown> = {
      app_id: oneSignalAppId,
      headings: { en: title, pt: title },
      contents: { en: message, pt: message },
      chrome_web_icon: "/pwa-192x192.png",
      firefox_icon: "/pwa-192x192.png",
    };

    if (link) {
      oneSignalPayload.url = link;
    }

    if (target_user_id) {
      // Send to specific user via external_id
      targetUserIds = [target_user_id.trim()];
      oneSignalPayload.include_aliases = { external_id: [target_user_id.trim()] };
      oneSignalPayload.target_channel = "push";
      console.log(`Targeting specific user: ${target_user_id}`);
    } else if (target_club_id) {
      // Get all users for this club, then send via external_ids
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("favorite_club_id", target_club_id);
      targetUserIds = (profiles || []).map((p) => p.user_id);
      if (targetUserIds.length === 0) {
        return new Response(
          JSON.stringify({ success: true, push_sent: 0, push_failed: 0, pwa_subscribers: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      oneSignalPayload.include_aliases = { external_id: targetUserIds };
      oneSignalPayload.target_channel = "push";
      console.log(`Targeting club ${target_club_id}: ${targetUserIds.length} fans`);
    } else {
      // Send to all subscribed users
      oneSignalPayload.included_segments = ["All"];
      console.log("Broadcasting to all OneSignal subscribers");
    }

    // Send via OneSignal REST API
    const oneSignalRes = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Key ${oneSignalRestApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const oneSignalData = await oneSignalRes.json();
    console.log("OneSignal response:", JSON.stringify(oneSignalData));

    const pushSent = oneSignalData.recipients ?? 0;
    const pushFailed = oneSignalData.errors ? 1 : 0;

    if (!oneSignalRes.ok) {
      console.error("OneSignal error:", oneSignalData);
    }

    // Log notification
    supabaseAdmin.from("notification_logs").insert({
      title,
      message,
      type,
      link: link || null,
      target: target_user_id ? "user" : target_club_id ? "club" : "all",
      target_user_id: target_user_id || null,
      push_sent: pushSent,
      push_failed: pushFailed,
      in_app_sent: 0,
      sent_by: userId,
    }).then(() => {}).catch(console.error);

    return new Response(
      JSON.stringify({
        success: oneSignalRes.ok,
        push_sent: pushSent,
        push_failed: pushFailed,
        pwa_subscribers: pushSent,
        onesignal_id: oneSignalData.id,
        onesignal_errors: oneSignalData.errors || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
