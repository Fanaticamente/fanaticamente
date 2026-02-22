import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PushPermission = "default" | "granted" | "denied";

// Convert base64url string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyServiceWorkerReg = any;

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as PushPermission);

        // Register the push SW alongside the workbox SW
        try {
          await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
          console.log("[Push] sw-push.js registered");
        } catch (e) {
          console.warn("[Push] sw-push.js registration failed:", e);
        }

        // Check if already subscribed
        try {
          const reg: AnyServiceWorkerReg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) setIsSubscribed(true);
        } catch {
          // ignore
        }

        // Restore saved subscription id
        const saved = localStorage.getItem("onesignal_subscription_id");
        if (saved) setSubscriptionId(saved);
      }
    };

    checkSupport();
  }, []);

  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Step 1: Request permission (must be direct user gesture)
      const permResult = await Notification.requestPermission();
      setPermission(permResult as PushPermission);
      console.log("[Push] Permission result:", permResult);

      if (permResult !== "granted") {
        toast.error("Permissão negada. Habilite nas Configurações → Notificações.");
        return false;
      }

      // Step 2: Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return false;
      }

      // Step 3: Fetch OneSignal's VAPID public key
      console.log("[Push] Fetching VAPID key...");
      const vapidRes = await supabase.functions.invoke("onesignal-subscribe", {
        body: { action: "get_vapid_key" },
      });
      console.log("[Push] VAPID response:", vapidRes);

      const vapidPublicKey: string | null = vapidRes.data?.vapid_public_key ?? null;
      console.log("[Push] VAPID key:", vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : "null");

      if (!vapidPublicKey) {
        toast.error("Erro ao obter chave de notificações do servidor.");
        return false;
      }

      // Step 4: Get the service worker registration
      const reg: AnyServiceWorkerReg = await navigator.serviceWorker.ready;
      console.log("[Push] Service worker ready, subscribing...");

      // Unsubscribe any existing subscription first to avoid conflicts
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        console.log("[Push] Removing existing subscription");
        await existingSub.unsubscribe();
      }

      // Subscribe with VAPID key
      let pushSub: PushSubscription | null = null;
      try {
        pushSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        console.log("[Push] Subscribed successfully:", pushSub.endpoint.substring(0, 60));
      } catch (subErr) {
        console.error("[Push] pushManager.subscribe failed:", subErr);
        toast.error("Erro ao registrar notificações. Verifique se o app está instalado como PWA.");
        return false;
      }

      // Step 5: Register with OneSignal via REST API
      const subJson = pushSub.toJSON();
      const auth = subJson.keys?.auth;
      const p256dh = subJson.keys?.p256dh;

      if (!auth || !p256dh) {
        console.error("[Push] Missing keys - auth:", !!auth, "p256dh:", !!p256dh);
        toast.error("Erro ao obter chaves de notificação.");
        return false;
      }

      console.log("[Push] Registering with OneSignal...");
      const regRes = await supabase.functions.invoke("onesignal-subscribe", {
        body: {
          action: "subscribe",
          subscription: { endpoint: pushSub.endpoint, keys: { auth, p256dh } },
        },
      });

      console.log("[Push] OneSignal register response:", regRes);

      if (regRes.data?.subscription_id) {
        setSubscriptionId(regRes.data.subscription_id);
        localStorage.setItem("onesignal_subscription_id", regRes.data.subscription_id);
      }

      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
      return true;
    } catch (e) {
      console.error("[Push] subscribe error:", e);
      toast.error("Erro ao ativar notificações push.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const reg: AnyServiceWorkerReg = await navigator.serviceWorker.ready;
      const sub: PushSubscription | null = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      const savedId = subscriptionId || localStorage.getItem("onesignal_subscription_id");
      if (savedId) {
        await supabase.functions.invoke("onesignal-subscribe", {
          body: {
            action: "unsubscribe",
            subscription: { subscription_id: savedId },
          },
        });
        localStorage.removeItem("onesignal_subscription_id");
        setSubscriptionId(null);
      }

      setIsSubscribed(false);
      setPermission("default");
      toast.success("Notificações push desativadas.");
      return true;
    } catch (e) {
      console.error("Push unsubscribe error:", e);
      toast.error("Erro ao desativar notificações push.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
};
