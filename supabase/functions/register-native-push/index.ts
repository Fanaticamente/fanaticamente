import { legalGate } from "../_shared/legalGate.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("register"), token: z.string().min(20).max(4096), platform: z.enum(["ios", "android"]) }),
  z.object({ action: z.literal("unregister"), token: z.string().min(20).max(4096) }),
  z.object({ action: z.literal("status"), token: z.string().min(20).max(4096) }),
]);

// Registers app-store (iOS/Android) FCM tokens for the signed-in user; the owner always comes from the validated session.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  { const block = await legalGate(req); if (block) return block; }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims } = await userClient.auth.getClaims(authHeader.slice(7));
  const userId = claims?.claims?.sub;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = parsed.data;

  if (body.action === "register") {
    // A device token belongs to whoever is signed in on that phone now.
    const { error } = await admin.from("native_push_tokens").upsert(
      { user_id: userId, token: body.token, platform: body.platform, last_error: null },
      { onConflict: "token" },
    );
    if (error) { console.error("register failed", error); return json({ error: "Could not save device" }, 500); }
    return json({ success: true, persisted: true });
  }

  if (body.action === "unregister") {
    const { error } = await admin.from("native_push_tokens").delete().eq("token", body.token).eq("user_id", userId);
    if (error) return json({ error: "Could not remove device" }, 500);
    return json({ success: true });
  }

  const { data } = await admin.from("native_push_tokens").select("id").eq("token", body.token).eq("user_id", userId).maybeSingle();
  return json({ registered: !!data });
});
