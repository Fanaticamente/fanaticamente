import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPushRegistration, savePushSubscription } from "@/lib/pushRegistration";
import { toast } from "sonner";

export type PushPermission = "default" | "granted" | "denied";

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const persist = useCallback(async (subscription: PushSubscription) => {
    return savePushSubscription(subscription, async json => {
      const { data, error } = await supabase.functions.invoke("onesignal-subscribe", {
        body: { action: "subscribe", subscription: { endpoint: json.endpoint, keys: json.keys } },
      });
      if (error) throw error;
      return data ?? {};
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supported = window.self === window.top && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    setIsSubscribed(false);
    if (!supported) return;
    setPermission(Notification.permission);
    if (!user || Notification.permission !== "granted") return;
    setIsLoading(true);
    // Repair browser-only registrations: permission alone does not prove delivery.
    void (async () => {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await persist(subscription);
        if (!cancelled) setIsSubscribed(true);
      }
    })().catch(() => {
      if (!cancelled) setIsSubscribed(false);
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, persist]);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) { toast.error("Abra o aplicativo instalado ou em uma aba própria para ativar as notificações."); return false; }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isIOS && !standalone) { toast.error("No iPhone, abra pelo ícone adicionado à Tela de Início para ativar os alertas."); return false; }
    setIsLoading(true);
    try {
      // Must happen synchronously from the user's click, before network requests.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") { toast.error("Permita notificações nos Ajustes do iPhone ou nas configurações do navegador."); return false; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session unavailable");
      const { data, error } = await supabase.functions.invoke("onesignal-subscribe", { body: { action: "get_vapid_key" } });
      if (error || !data?.vapid_public_key) throw new Error("Notification configuration unavailable");
      const registration = await getPushRegistration();
      let subscription = await registration.pushManager.getSubscription();
      const key = urlBase64ToUint8Array(data.vapid_public_key);
      if (subscription?.options.applicationServerKey) {
        const existingKey = new Uint8Array(subscription.options.applicationServerKey);
        if (existingKey.length !== key.length || existingKey.some((byte, index) => byte !== key[index])) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await persist(subscription);
      setIsSubscribed(true);
      toast.success("Notificações ativadas!");
      return true;
    } catch {
      setIsSubscribed(false);
      toast.error("Não foi possível ativar os alertas. Tente novamente com o aplicativo aberto pelo ícone.");
      return false;
    } finally { setIsLoading(false); }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const { error } = await supabase.functions.invoke("onesignal-subscribe", { body: { action: "unsubscribe", subscription: { endpoint: subscription.endpoint } } });
        if (error) throw error;
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success("Notificações desativadas.");
      return true;
    } catch { toast.error("Não foi possível desativar os alertas. Tente novamente."); return false; }
    finally { setIsLoading(false); }
  };

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
};
