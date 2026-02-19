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
      // Return OneSignal's VAPID public key for the app
      // OneSignal uses its own VAPID key associated with the App ID
      // We fetch it from OneSignal's API
      const appRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
        headers: {
          "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!appRes.ok) {
        const errText = await appRes.text();
        console.error("OneSignal get app error:", errText);
        return new Response(JSON.stringify({ error: "Failed to get app info" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const appData = await appRes.json();
      return new Response(
        JSON.stringify({ 
          vapid_public_key: appData.vapid_public_key || null,
          app_id: ONESIGNAL_APP_ID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "subscribe" && subscription) {
      // Register the push subscription with OneSignal via REST API
      const { endpoint, keys } = subscription;

      // Create/update the subscription in OneSignal
      const osRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: {
            type: "SafariPush",
            token: endpoint,
            enabled: true,
            web_auth: keys.auth,
            web_p256: keys.p256dh,
          },
          retain_previous_owner: false,
          identity: {
            external_id: user.id,
          },
        }),
      });

      const osData = await osRes.json();
      console.log("OneSignal subscribe response:", JSON.stringify(osData));

      if (!osRes.ok) {
        console.error("OneSignal subscribe error:", osData);
        // Try alternate endpoint for web push (ChromeWeb type)
        const osRes2 = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/subscriptions`, {
          method: "POST",
          headers: {
            "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: {
              type: "ChromeWeb",
              token: endpoint,
              enabled: true,
              web_auth: keys.auth,
              web_p256: keys.p256dh,
            },
            retain_previous_owner: false,
            identity: {
              external_id: user.id,
            },
          }),
        });
        const osData2 = await osRes2.json();
        console.log("OneSignal subscribe response (ChromeWeb):", JSON.stringify(osData2));

        if (!osRes2.ok) {
          return new Response(JSON.stringify({ error: "Failed to register with OneSignal", details: osData2 }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, subscription_id: osData2.subscription?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, subscription_id: osData.subscription?.id }), {
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
