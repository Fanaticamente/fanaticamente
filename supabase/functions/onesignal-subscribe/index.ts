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
      // Use the VAPID_PUBLIC_KEY secret directly (more reliable than fetching from OneSignal API)
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      console.log("VAPID_PUBLIC_KEY present:", !!vapidPublicKey);
      
      if (!vapidPublicKey) {
        // Fallback: try fetching from OneSignal API
        const appRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
          headers: {
            "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (appRes.ok) {
          const appData = await appRes.json();
          console.log("OneSignal VAPID key from API:", appData.chrome_web_vapid_key || appData.safari_apns_certificate || "none");
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

      // Determine device type from endpoint
      const isApple = endpoint.includes("apple") || endpoint.includes("webkit");
      const deviceType = isApple ? 7 : 5; // 7 = Safari (macOS/iOS), 5 = Chrome Web Push

      // Use OneSignal v1 Players API (more reliable for manual registration)
      const playerPayload = {
        app_id: ONESIGNAL_APP_ID,
        device_type: deviceType,
        identifier: endpoint,
        web_auth: keys.auth,
        web_p256: keys.p256dh,
        external_user_id: user.id,
        notification_types: 1, // subscribed
      };

      console.log("Registering player with device_type:", deviceType, "endpoint prefix:", endpoint.substring(0, 60));

      const osRes = await fetch("https://onesignal.com/api/v1/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerPayload),
      });

      let osData: Record<string, unknown> = {};
      const resText = await osRes.text();
      try {
        osData = JSON.parse(resText);
      } catch {
        console.error("OneSignal non-JSON response:", resText);
        osData = { raw: resText };
      }

      console.log("OneSignal player response:", JSON.stringify(osData));

      if (!osRes.ok) {
        console.error("OneSignal register error, status:", osRes.status);
        
        // Retry with alternate device type
        const altType = deviceType === 7 ? 5 : 7;
        console.log("Retrying with device_type:", altType);
        
        const osRes2 = await fetch("https://onesignal.com/api/v1/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...playerPayload, device_type: altType }),
        });

        const resText2 = await osRes2.text();
        let osData2: Record<string, unknown> = {};
        try { osData2 = JSON.parse(resText2); } catch { osData2 = { raw: resText2 }; }
        console.log("OneSignal retry response:", JSON.stringify(osData2));

        if (!osRes2.ok) {
          return new Response(JSON.stringify({ error: "Failed to register", details: osData2 }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, subscription_id: osData2.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, subscription_id: osData.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unsubscribe" && subscription?.subscription_id) {
      const osRes = await fetch(
        `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/subscriptions/${subscription.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
          },
        }
      );

      if (!osRes.ok) {
        const errText = await osRes.text();
        console.error("OneSignal unsubscribe error:", errText);
      }

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
