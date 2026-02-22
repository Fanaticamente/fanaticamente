import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(JSON.stringify({ error: "OneSignal not configured" }), {
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

      // ALWAYS use device_type 5 (Chrome Web Push) for Web Push API subscriptions
      // device_type 7 is for Safari macOS native push (APNs for websites), NOT for iOS PWA web push
      const deviceType = 5;

      const playerPayload = {
        app_id: ONESIGNAL_APP_ID,
        device_type: deviceType,
        identifier: endpoint,
        web_auth: keys.auth,
        web_p256: keys.p256dh,
        notification_types: 1,
      };

      console.log("Registering player with device_type:", deviceType, "endpoint prefix:", endpoint.substring(0, 60));

      const osRes = await fetch("https://onesignal.com/api/v1/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerPayload),
      });

      const resText = await osRes.text();
      let osData: Record<string, unknown> = {};
      try { osData = JSON.parse(resText); } catch { osData = { raw: resText }; }
      console.log("OneSignal player response:", JSON.stringify(osData));

      if (!osRes.ok || !osData.success) {
        console.error("OneSignal register error, status:", osRes.status);
        return new Response(JSON.stringify({ error: "Failed to register with OneSignal", details: osData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const playerId = osData.id as string;
      console.log("Player registered successfully, id:", playerId);

      // Save/update the player_id in push_subscriptions table
      const { error: upsertError } = await supabaseAdmin
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint,
            auth: keys.auth,
            p256dh: keys.p256dh,
            onesignal_player_id: playerId,
            user_agent: "",
          },
          { onConflict: "user_id,endpoint" }
        );

      if (upsertError) {
        console.error("Error saving push subscription:", upsertError);
        // Try insert without unique constraint match (update existing by user_id)
        await supabaseAdmin
          .from("push_subscriptions")
          .update({ onesignal_player_id: playerId, endpoint, auth: keys.auth, p256dh: keys.p256dh })
          .eq("user_id", user.id);
      }

      return new Response(JSON.stringify({ success: true, subscription_id: playerId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unsubscribe" && subscription?.subscription_id) {
      // Delete from OneSignal
      try {
        await fetch(
          `https://onesignal.com/api/v1/players/${subscription.subscription_id}?app_id=${ONESIGNAL_APP_ID}`,
          { method: "DELETE" }
        );
      } catch (e) {
        console.error("OneSignal delete player error:", e);
      }

      // Remove from our database
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
