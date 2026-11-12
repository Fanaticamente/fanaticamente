import { legalGate } from "../_shared/legalGate.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  { const __legalBlock = await legalGate(req); if (__legalBlock) return __legalBlock; }
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!Deno.env.get("VAPID_PUBLIC_KEY") || !Deno.env.get("VAPID_PRIVATE_KEY")) {
      return new Response(JSON.stringify({ error: "Direct push not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, subscription } = body;

    if (action === "get_vapid_key") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      console.log("VAPID_PUBLIC_KEY present:", !!vapidPublicKey);
      
      if (!vapidPublicKey) {
        const appRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
          headers: {
            "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (appRes.ok) {
          const appData = await appRes.json();
          return new Response(
            JSON.stringify({ 
              vapid_public_key: appData.chrome_web_vapid_key || appData.vapid_public_key || null,
              app_id: ONESIGNAL_APP_ID,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const errText = await appRes.text();
        console.error("OneSignal get app error:", errText);
        return new Response(JSON.stringify({ error: "No VAPID key configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ 
          vapid_public_key: vapidPublicKey,
          app_id: ONESIGNAL_APP_ID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "subscribe" && subscription) {
      const { endpoint, keys } = subscription;

      if (typeof endpoint !== "string" || !keys?.auth || !keys?.p256dh) {
        return new Response(JSON.stringify({ error: "Invalid subscription" }), { status: 400, headers: corsHeaders });
      }
      // Direct Web Push is the delivery engine: audience-provider availability
      // must not prevent the device from being saved for background delivery.
      const { error: saveError } = await supabaseAdmin.from("push_subscriptions").upsert({
        user_id: user.id, endpoint, auth: keys.auth, p256dh: keys.p256dh, user_agent: "",
      }, { onConflict: "user_id,endpoint" });
      if (saveError) {
        console.error("Push subscription persistence failed:", saveError.code);
        return new Response(JSON.stringify({ error: "Could not save subscription" }), { status: 500, headers: corsHeaders });
      }
      let playerId: string | null = null;
      if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
        try {
          const response = await fetch("https://onesignal.com/api/v1/players", {
            method: "POST", headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, device_type: 5, identifier: endpoint,
              web_auth: keys.auth, web_p256: keys.p256dh, notification_types: 1 }),
          });
          const result = await response.json();
          if (response.ok && result.success && typeof result.id === "string") {
            playerId = result.id;
            await supabaseAdmin.from("push_subscriptions").update({ onesignal_player_id: playerId })
              .eq("user_id", user.id).eq("endpoint", endpoint);
          } else console.warn("Audience registration unavailable:", response.status);
        } catch { console.warn("Audience registration unavailable; direct push remains active"); }
      }

      return new Response(JSON.stringify({ success: true, subscription_id: playerId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unsubscribe" && typeof subscription?.endpoint === "string") {
      const { error } = await supabaseAdmin.from("push_subscriptions").delete()
        .eq("user_id", user.id).eq("endpoint", subscription.endpoint);
      if (error) return new Response(JSON.stringify({ error: "Could not remove subscription" }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
