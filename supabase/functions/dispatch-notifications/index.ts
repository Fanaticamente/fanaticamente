import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    const v = k.split(".").reduce((acc: any, p: string) => (acc == null ? acc : acc[p]), data);
    return v == null ? "" : String(v);
  });
}

function inQuietHours(start: number | null, end: number | null): boolean {
  if (start == null || end == null) return false;
  const h = new Date().getUTCHours() - 3; // BRT approx
  const hour = (h + 24) % 24;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require internal dispatch secret (called from cron / trusted server)
  const internalSecretEnv = Deno.env.get("INTERNAL_DISPATCH_SECRET") || "";
  const providedSecret = req.headers.get("x-internal-secret") || "";
  if (!internalSecretEnv || providedSecret !== internalSecretEnv) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sendUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`;
  const internalSecret = internalSecretEnv;

  // Fetch unprocessed events (limit 200 per run)
  const { data: events, error } = await supabase
    .from("notification_events")
    .select("*")
    .is("processed_at", null)
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Fetch events error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  let processed = 0;
  let dispatched = 0;

  for (const ev of events || []) {
    try {
      const { data: rules } = await supabase
        .from("notification_rules")
        .select("*")
        .eq("event_type", ev.event_type)
        .eq("is_active", true);

      for (const rule of rules || []) {
        // Resolve audience -> target user ids
        let targets: string[] = [];
        const payload = ev.payload || {};
        if (rule.audience === "event_user" && ev.user_id) {
          targets = [ev.user_id];
        } else if (rule.audience === "event_payload_target" && payload.target_user_id) {
          targets = [payload.target_user_id];
        } else if (rule.audience?.startsWith("role:")) {
          const role = rule.audience.slice(5);
          const { data: roleUsers } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", role);
          targets = (roleUsers || []).map((r: any) => r.user_id);
        }

        if (targets.length === 0) continue;
        if (inQuietHours(rule.quiet_hours_start, rule.quiet_hours_end)) continue;

        // Cooldown filter
        if (rule.cooldown_hours > 0) {
          const since = new Date(Date.now() - rule.cooldown_hours * 3600 * 1000).toISOString();
          const { data: recent } = await supabase
            .from("notification_rule_runs")
            .select("user_id")
            .eq("rule_id", rule.id)
            .gte("fired_at", since)
            .in("user_id", targets);
          const blocked = new Set((recent || []).map((r: any) => r.user_id));
          targets = targets.filter((t) => !blocked.has(t));
        }

        const ctx = { ...payload, user_id: ev.user_id };
        const title = renderTemplate(rule.title_template, ctx);
        const body = renderTemplate(rule.body_template, ctx);
        const link = rule.link_template ? renderTemplate(rule.link_template, ctx) : null;

        for (const uid of targets) {
          const res = await fetch(sendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": internalSecret,
            },
            body: JSON.stringify({
              title,
              message: body,
              type: rule.type,
              link,
              target_user_id: uid,
            }),
          });
          if (res.ok) dispatched++;
          else console.error("send failed", uid, await res.text());

          await supabase.from("notification_rule_runs").insert({
            rule_id: rule.id,
            user_id: uid,
            event_id: ev.id,
          });
        }
      }

      await supabase
        .from("notification_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", ev.id);
      processed++;
    } catch (e) {
      console.error("Event processing error:", ev.id, e);
    }
  }

  return new Response(
    JSON.stringify({ processed, dispatched, queue_size: events?.length || 0 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});