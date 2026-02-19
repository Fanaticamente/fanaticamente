import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PushPermission = "default" | "granted" | "denied";

const ONESIGNAL_SCRIPT_ID = "onesignal-sdk";

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
      // Check if already subscribed via OneSignal
      checkOneSignalSubscription();
    }
  }, []);

  const checkOneSignalSubscription = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignal = (window as any).OneSignalDeferred;
      if (OneSignal) {
        OneSignal.push(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).OneSignal.isPushNotificationsEnabled((enabled: boolean) => {
            setIsSubscribed(enabled);
          });
        });
      }
    } catch {
      // OneSignal not loaded yet
    }
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

      // Get current user to set as external_id in OneSignal
      const { data: { user } } = await supabase.auth.getUser();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignalObj = (window as any).OneSignal;
      if (OneSignalObj) {
        // Set external ID to link OneSignal player to our user
        if (user?.id) {
          await OneSignalObj.login(user.id);
        }
        await OneSignalObj.Notifications.requestPermission();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignalObj = (window as any).OneSignal;
      if (OneSignalObj) {
        await OneSignalObj.Notifications.setDefaultUrl(null);
        // Opt out from notifications
        await OneSignalObj.User.PushSubscription.optOut();
      }

      setIsSubscribed(false);
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
