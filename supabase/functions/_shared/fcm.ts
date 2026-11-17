const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export type FcmResult = { ok: true } | { ok: false; stale: boolean; status: number; detail: string };

/** Sends one notification to an app-store device token through Firebase Cloud Messaging. */
export async function sendFcm(token: string, title: string, body: string, data: Record<string, string>): Promise<FcmResult> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
  if (!lovableKey || !connKey) return { ok: false, stale: false, status: 0, detail: "Firebase not configured" };
  const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: { priority: "high", notification: { sound: "default", channel_id: "fanaticamente_default" } },
        apns: { headers: { "apns-priority": "10" }, payload: { aps: { sound: "default" } } },
      },
    }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text();
  const stale = res.status === 404 || (res.status === 400 && /UNREGISTERED|INVALID_ARGUMENT|registration-token/i.test(detail));
  console.error(`FCM send failed [${res.status}]: ${detail.slice(0, 300)}`);
  return { ok: false, stale, status: res.status, detail };
}
