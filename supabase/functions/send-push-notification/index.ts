import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto helpers for direct push (bypasses OneSignal delivery issues)
async function sendDirectWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<boolean> {
  try {
    // Import web-push compatible implementation
    const { default: webpush } = await import("npm:web-push@3.6.7");
    
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey,
    );

    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      payload,
      { TTL: 86400 }
    );
    return true;
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string };
    console.error(`Direct push failed for ${endpoint.substring(0, 50)}:`, err.statusCode, err.body || String(e));
    // 410 = subscription expired
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log("Subscription expired/invalid, should be cleaned up");
    }
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedInternal = Deno.env.get("INTERNAL_DISPATCH_SECRET");
    const isInternal = !!(expectedInternal && internalSecret && internalSecret === expectedInternal);

    if (!isInternal && !authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;
    if (!isInternal) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader! } } }
      );
      const token = authHeader!.replace("Bearer ", "");
      const { data: claimsData } = await supabaseUser.auth.getClaims(token);
      if (!claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      userId = claimsData.claims.sub;
      const { data: rolesData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const hasPermission = rolesData?.some((r: { role: string }) => ["admin", "developer"].includes(r.role));
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
      }
    }

    const body = await req.json();
    const { title, message, type = "info", link, target_user_id, target_club_id } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Determine target user IDs ──────────────────────────────────────
    let targetUserIds: string[] = [];

    if (target_user_id) {
      targetUserIds = [target_user_id.trim()];
    } else if (target_club_id) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("favorite_club_id", target_club_id);
      targetUserIds = (profiles || []).map((p: { user_id: string }) => p.user_id);
    } else {
      // Broadcast to all users with push subscriptions
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("user_id");
      const uniqueIds = [...new Set((subs || []).map((s: { user_id: string }) => s.user_id))];
      targetUserIds = uniqueIds;
    }

    // ── Create IN-APP notifications ────────────────────────────────────
    let inAppSent = 0;
    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map((uid: string) => ({
        user_id: uid,
        title,
        message,
        type,
        link: link || null,
        is_read: false,
      }));

      // Insert in batches of 500
      for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        const { error: insertErr, count } = await supabaseAdmin
          .from("user_notifications")
          .insert(batch, { count: "exact" });
        if (insertErr) {
          console.error("Error creating in-app notifications:", insertErr);
        } else {
          inAppSent += count ?? batch.length;
        }
      }
      console.log(`In-app notifications created: ${inAppSent} for ${targetUserIds.length} users`);
    }

    // ── Send PUSH notifications directly via Web Push protocol ─────────
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@fanatica.app";

    let pushSent = 0;
    let pushFailed = 0;
    let totalDevices = 0;

    // Get push subscriptions for target users
    let subsQuery = supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id");

    if (targetUserIds.length > 0 && targetUserIds.length <= 100) {
      subsQuery = subsQuery.in("user_id", targetUserIds);
    }

    const { data: pushSubs } = await subsQuery;
    const validSubs = (pushSubs || []).filter((s: { endpoint: string; p256dh: string; auth: string }) => 
      s.endpoint && s.p256dh && s.auth
    );
    totalDevices = validSubs.length;

    if (totalDevices > 0 && vapidPublicKey && vapidPrivateKey) {
      console.log(`Sending direct Web Push to ${totalDevices} device(s)...`);

      const pushPayload = JSON.stringify({
        title,
        body: message,
        data: { url: link || "/", type },
      });

      // Send in parallel (max 10 concurrent)
      const batchSize = 10;
      for (let i = 0; i < validSubs.length; i += batchSize) {
        const batch = validSubs.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
            sendDirectWebPush(
              sub.endpoint,
              sub.p256dh,
              sub.auth,
              pushPayload,
              vapidSubject,
              vapidPublicKey,
              vapidPrivateKey,
            )
          )
        );

        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            pushSent++;
          } else {
            pushFailed++;
          }
        }
      }

      console.log(`Direct Web Push results: sent=${pushSent}, failed=${pushFailed}, total=${totalDevices}`);
    } else if (totalDevices === 0) {
      console.log("No push subscriptions found for target users");
    } else {
      console.error("VAPID keys not configured, cannot send direct push");
      pushFailed = totalDevices;
    }

    // ── Log notification ───────────────────────────────────────────────
    supabaseAdmin.from("notification_logs").insert({
      title,
      message,
      type,
      link: link || null,
      target: target_user_id ? "user" : target_club_id ? "club" : "all",
      target_user_id: target_user_id || null,
      push_sent: pushSent,
      push_failed: pushFailed,
      in_app_sent: inAppSent,
      sent_by: userId,
    }).then(() => {}).catch(console.error);

    return new Response(
      JSON.stringify({
        success: true,
        push_sent: pushSent,
        push_failed: pushFailed,
        pwa_subscribers: totalDevices,
        in_app_sent: inAppSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
