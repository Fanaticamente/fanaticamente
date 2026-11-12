/** Only app-shell workers may be removed; messaging survives manager visits. */
export function isAppShellWorker(scriptURL: string): boolean {
  try {
    const path = new URL(scriptURL).pathname;
    return path === "/sw.js" || path === "/service-worker.js";
  } catch {
    return false;
  }
}

export async function savePushSubscription(
  subscription: PushSubscription,
  save: (subscription: PushSubscriptionJSON) => Promise<{ success?: boolean; subscription_id?: string }>,
) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) {
    throw new Error("Incomplete push subscription");
  }
  const result = await save(json);
  if (!result.success) throw new Error("Push subscription was not saved");
  return result;
}

export async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  if (registration.active) return registration;
  await new Promise<void>((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) { reject(new Error("Notification worker unavailable")); return; }
    const timeout = setTimeout(() => { cleanup(); reject(new Error("Notification worker timed out")); }, 15000);
    const cleanup = () => { clearTimeout(timeout); worker.removeEventListener("statechange", check); };
    const check = () => {
      if (worker.state === "activated") { cleanup(); resolve(); }
      else if (worker.state === "redundant") { cleanup(); reject(new Error("Notification worker failed")); }
    };
    worker.addEventListener("statechange", check);
    check();
  });
  return registration;
}