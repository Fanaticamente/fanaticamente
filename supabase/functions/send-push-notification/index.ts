import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple VAPID JWT generation using Web Crypto API (no external deps)
async function generateVapidJwt(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import private key
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0)
  );
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signatureBase64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await generateVapidJwt(audience, vapidSubject, vapidPublic, vapidPrivate);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt},k=${vapidPublic}`,
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "normal",
      },
      body: payload,
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, status: response.status, error: text };
    }
    return { ok: true, status: response.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin role
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

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", claimsData.claims.sub)
      .single();

    if (!roleData || !["admin", "developer"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, message, type = "info", link, target_user_id, target_club_id, icon } = body;

    if (!title || !message) {
      return new Response(JSON.stringify({ error: "title and message are required" }), { status: 400, headers: corsHeaders });
    }

    // 1. Determine target user IDs
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

    // Insert in-app notifications in batches
    const notifRows = userIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    }));

    if (notifRows.length > 0) {
      await supabaseAdmin.from("user_notifications").insert(notifRows);
    }

    // 2. Send push notifications
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@fanaticamente.com";

    let pushSent = 0;
    let pushFailed = 0;

    if (vapidPublic && vapidPrivate) {
      // Build query for push subscriptions - filter to only users in userIds list
      let subsQuery = supabaseAdmin.from("push_subscriptions").select("*");
      if (userIds.length > 0) subsQuery = subsQuery.in("user_id", userIds);
      else {
        // No users matched the filter - skip push
        return new Response(
          JSON.stringify({ success: true, in_app_sent: 0, push_sent: 0, push_failed: 0, vapid_configured: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: subs } = await subsQuery;

      if (subs && subs.length > 0) {
        const pushPayload = JSON.stringify({
          title,
          body: message,
          icon: icon || "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          data: { url: link || "/" },
        });

        const results = await Promise.allSettled(
          subs.map((sub) =>
            sendWebPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              pushPayload,
              vapidPublic,
              vapidPrivate,
              vapidSubject
            )
          )
        );

        // Clean up expired subscriptions (410 Gone)
        const expiredEndpoints: string[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            if (result.value.ok) pushSent++;
            else {
              pushFailed++;
              if (result.value.status === 410) expiredEndpoints.push(subs[idx].endpoint);
            }
          } else pushFailed++;
        });

        if (expiredEndpoints.length > 0) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .in("endpoint", expiredEndpoints);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        in_app_sent: notifRows.length,
        push_sent: pushSent,
        push_failed: pushFailed,
        vapid_configured: !!(vapidPublic && vapidPrivate),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
