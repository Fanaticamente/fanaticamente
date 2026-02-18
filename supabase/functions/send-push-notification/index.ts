import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// Edge Function handler
// ============================================================
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

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    const hasPermission = rolesData?.some((r) => ["admin", "developer"].includes(r.role));
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, message, type = "info", link, target_user_id, target_club_id, icon } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine target user IDs
    let userIds: string[] = [];

    if (target_user_id) {
      if (typeof target_user_id !== "string" || target_user_id.trim() === "") {
        return new Response(JSON.stringify({ error: "target_user_id inválido" }), { status: 400, headers: corsHeaders });
      }
      userIds = [target_user_id.trim()];
      console.log(`Targeting specific user: ${target_user_id}`);
    } else if (target_club_id) {
      const { data: profiles, error: profilesErr } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("favorite_club_id", target_club_id);
      if (profilesErr) console.error("Error fetching club fans:", profilesErr);
      userIds = (profiles || []).map((p) => p.user_id);
      console.log(`Targeting club ${target_club_id}: ${userIds.length} fans`);
    } else {
      const { data: roles, error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");
      if (rolesErr) console.error("Error fetching users:", rolesErr);
      userIds = (roles || []).map((r) => r.user_id);
      console.log(`Broadcasting to ${userIds.length} users`);
    }

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@fanaticamente.com";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(
        JSON.stringify({ success: false, error: "VAPID keys not configured", push_sent: 0, push_failed: 0 }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    console.log("web-push configured with VAPID details");

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, push_sent: 0, push_failed: 0, pwa_subscribers: 0, vapid_configured: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    const subsCount = subs?.length ?? 0;
    console.log(`Found ${subsCount} PWA push subscriptions for ${userIds.length} target user(s)`);

    let pushSent = 0;
    let pushFailed = 0;

    if (subs && subs.length > 0) {
      const pushPayload = JSON.stringify({
        title,
        body: message,
        icon: icon || "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { url: link || "/" },
      });

      const results = await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };
            const result = await webpush.sendNotification(pushSubscription, pushPayload);
            console.log(`Push sent to ${sub.endpoint.substring(0, 50)}... status: ${result.statusCode}`);
            return { ok: true, status: result.statusCode };
          } catch (e: unknown) {
            const err = e as { statusCode?: number; body?: string; message?: string };
            const statusCode = err?.statusCode;
            console.error(`Push failed for user ${sub.user_id}: [${statusCode}]`, err?.body || err?.message);
            return { ok: false, status: statusCode, error: err?.body || err?.message };
          }
        })
      );

      const expiredEndpoints: string[] = [];
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          if (result.value.ok) {
            pushSent++;
          } else {
            pushFailed++;
            if (result.value.status === 410) expiredEndpoints.push(subs[idx].endpoint);
          }
        } else {
          pushFailed++;
          console.error(`Push rejected for sub ${idx}:`, result.reason);
        }
      });

      if (expiredEndpoints.length > 0) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .in("endpoint", expiredEndpoints);
        console.log(`Removed ${expiredEndpoints.length} expired push subscriptions`);
      }
    }

    // Log notification (non-blocking)
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
      sent_by: userData.user.id,
    }).then(() => {}).catch(console.error);

    return new Response(
      JSON.stringify({
        success: true,
        push_sent: pushSent,
        push_failed: pushFailed,
        pwa_subscribers: subsCount,
        vapid_configured: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
