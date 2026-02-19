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
    const checkSupport = () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as PushPermission);

        // Check if already subscribed
        navigator.serviceWorker.ready
          .then((reg: AnyServiceWorkerReg) => reg.pushManager.getSubscription())
          .then((sub: unknown) => {
            if (sub) setIsSubscribed(true);
          })
          .catch(() => {});

        // Restore saved subscription id
        const saved = localStorage.getItem("onesignal_subscription_id");
        if (saved) setSubscriptionId(saved);
      }
    };

    checkSupport();
    const timer = setTimeout(checkSupport, 1500);
    return () => clearTimeout(timer);
  }, []);

  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Step 1: Request permission (must be direct user gesture)
      const permResult = await Notification.requestPermission();
      setPermission(permResult as PushPermission);

      if (permResult !== "granted") {
        toast.error("Permissão negada. Habilite nas Configurações do iPhone → Notificações.");
        return false;
      }

      // Step 2: Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return false;
      }

      // Step 3: Fetch OneSignal's VAPID public key from our edge function
      const vapidRes = await supabase.functions.invoke("onesignal-subscribe", {
        body: { action: "get_vapid_key" },
      });

      const vapidPublicKey: string | null = vapidRes.data?.vapid_public_key ?? null;

      // Step 4: Subscribe via Push Manager
      const reg: AnyServiceWorkerReg = await navigator.serviceWorker.ready;

      let pushSub: PushSubscription | null = null;

      // Try with VAPID key first (required for Chrome/Android), then without (iOS may not need it)
      const trySubscribe = async (withKey: boolean): Promise<PushSubscription> => {
        const opts: Record<string, unknown> = { userVisibleOnly: true };
        if (withKey && vapidPublicKey) {
          opts.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        }
        return reg.pushManager.subscribe(opts);
      };

      try {
        pushSub = await trySubscribe(true);
      } catch (e1) {
        console.warn("[Push] subscribe with VAPID failed, trying without:", e1);
        try {
          pushSub = await trySubscribe(false);
        } catch (e2) {
          console.error("[Push] subscribe failed:", e2);
          toast.error("Erro ao registrar notificações. Verifique se o app está instalado como PWA.");
          return false;
        }
      }

      if (!pushSub) {
        toast.error("Não foi possível criar a subscrição push.");
        return false;
      }

      // Step 5: Register with OneSignal via REST API
      const subJson = pushSub.toJSON();
      const endpoint = pushSub.endpoint;
      const auth = subJson.keys?.auth;
      const p256dh = subJson.keys?.p256dh;

      if (!auth || !p256dh) {
        toast.error("Erro ao obter chaves de notificação.");
        return false;
      }

      const regRes = await supabase.functions.invoke("onesignal-subscribe", {
        body: {
          action: "subscribe",
          subscription: { endpoint, keys: { auth, p256dh } },
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
      console.error("Push subscribe error:", e);
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
