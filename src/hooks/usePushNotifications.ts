import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PushPermission = "default" | "granted" | "denied";

const PUSH_ENABLED_KEY = "push_notifications_enabled";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as PushPermission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await (reg as any).pushManager?.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  const getVapidPublicKey = async (): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke("save-push-subscription", {
      body: { action: "get_vapid_public_key" },
    });
    if (error || !data?.vapid_public_key) return null;
    return data.vapid_public_key;
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error("Notificações push não são suportadas neste navegador.");
      return false;
    }

    setIsLoading(true);
    try {
      const notifPermission = await Notification.requestPermission();
      setPermission(notifPermission as PushPermission);

      if (notifPermission !== "granted") {
        toast.error("Permissão de notificações negada. Habilite nas configurações do navegador.");
        return false;
      }

      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        toast.error("VAPID não configurado. Configure as chaves VAPID no painel.");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await (reg as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = sub.toJSON();
      await supabase.functions.invoke("save-push-subscription", {
        body: {
          action: "subscribe",
          subscription: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth,
            },
          },
        },
      });

      setIsSubscribed(true);
      localStorage.setItem(PUSH_ENABLED_KEY, "true");
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
      const reg = await navigator.serviceWorker.ready;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await (reg as any).pushManager?.getSubscription();

      if (sub) {
        await supabase.functions.invoke("save-push-subscription", {
          body: {
            action: "unsubscribe",
            subscription: { endpoint: sub.endpoint },
          },
        });
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      localStorage.removeItem(PUSH_ENABLED_KEY);
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
