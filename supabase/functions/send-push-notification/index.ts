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

    // Build OneSignal notification payload
    const oneSignalPayload: Record<string, unknown> = {
      app_id: oneSignalAppId,
      headings: { en: title, pt: title },
      contents: { en: message, pt: message },
      chrome_web_icon: "/pwa-192x192.png",
      firefox_icon: "/pwa-192x192.png",
    };

    if (link) {
      oneSignalPayload.url = link;
    }

    // Determine player IDs from our push_subscriptions table
    let targetUserIds: string[] = [];

    if (target_user_id) {
      targetUserIds = [target_user_id.trim()];
      
      // Get player IDs for this specific user
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("onesignal_player_id")
        .eq("user_id", target_user_id.trim())
        .not("onesignal_player_id", "is", null);

      const playerIds = (subs || []).map((s) => s.onesignal_player_id).filter(Boolean);
      
      if (playerIds.length > 0) {
        oneSignalPayload.include_player_ids = playerIds;
        console.log(`Targeting user ${target_user_id} with ${playerIds.length} player(s):`, playerIds);
      } else {
        console.log(`No registered devices found for user ${target_user_id}`);
        return new Response(
          JSON.stringify({ success: true, push_sent: 0, push_failed: 1, pwa_subscribers: 0, error: "No registered devices for this user" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (target_club_id) {
      // Get all users for this club
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("favorite_club_id", target_club_id);
      
      const clubUserIds = (profiles || []).map((p) => p.user_id);
      targetUserIds = clubUserIds;

      if (clubUserIds.length === 0) {
        return new Response(
          JSON.stringify({ success: true, push_sent: 0, push_failed: 0, pwa_subscribers: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get player IDs for these users
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("onesignal_player_id")
        .in("user_id", clubUserIds)
        .not("onesignal_player_id", "is", null);

      const playerIds = (subs || []).map((s) => s.onesignal_player_id).filter(Boolean);

      if (playerIds.length > 0) {
        oneSignalPayload.include_player_ids = playerIds;
        console.log(`Targeting club ${target_club_id}: ${playerIds.length} device(s) from ${clubUserIds.length} fans`);
      } else {
        console.log(`No registered devices for club ${target_club_id}`);
        return new Response(
          JSON.stringify({ success: true, push_sent: 0, push_failed: 1, pwa_subscribers: 0, error: "No registered devices for this club" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Broadcast: get ALL player IDs from our database
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("onesignal_player_id")
        .not("onesignal_player_id", "is", null);

      const playerIds = (subs || []).map((s) => s.onesignal_player_id).filter(Boolean);

      if (playerIds.length > 0) {
        oneSignalPayload.include_player_ids = playerIds;
        console.log(`Broadcasting to ${playerIds.length} registered device(s)`);
      } else {
        // Fallback to included_segments if no player IDs in DB
        oneSignalPayload.included_segments = ["All"];
        console.log("No player IDs in DB, falling back to All segment");
      }
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

    // OneSignal may not return "recipients" when using include_player_ids
    // Use the number of player IDs we targeted as the count
    const targetedPlayerIds = (oneSignalPayload.include_player_ids as string[]) || [];
    const wasAccepted = oneSignalRes.ok && oneSignalData.id;
    const pushSent = wasAccepted ? (oneSignalData.recipients ?? targetedPlayerIds.length) : 0;
    const pushFailed = (!wasAccepted || oneSignalData.errors) ? 1 : 0;

    if (!oneSignalRes.ok) {
      console.error("OneSignal error:", oneSignalData);
    }

    console.log(`Result: accepted=${wasAccepted}, pushSent=${pushSent}, targeted=${targetedPlayerIds.length}`);

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
        success: wasAccepted,
        push_sent: pushSent,
        push_failed: pushFailed,
        pwa_subscribers: targetedPlayerIds.length,
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
