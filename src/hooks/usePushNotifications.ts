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
      const OneSignalObj = (window as any).OneSignal;
      if (OneSignalObj) {
        // Use the v11 API
        const optedIn = OneSignalObj.User?.PushSubscription?.optedIn;
        if (typeof optedIn === "boolean") {
          setIsSubscribed(optedIn);
        }
        const perm = OneSignalObj.Notifications?.permission;
        if (typeof perm === "boolean") {
          setPermission(perm ? "granted" : "default");
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignalObj = (window as any).OneSignal;
      
      if (!OneSignalObj) {
        toast.error("SDK de notificações não carregado. Tente recarregar o app.");
        return false;
      }

      // Get current user to set as external_id in OneSignal
      const { data: { user } } = await supabase.auth.getUser();

      // Login user first so OneSignal knows who this device belongs to
      if (user?.id) {
        try {
          await OneSignalObj.login(user.id);
        } catch (loginErr) {
          console.warn("[OneSignal] login error (non-fatal):", loginErr);
        }
      }

      // Let OneSignal handle the permission request (works properly on iOS PWA)
      const granted = await OneSignalObj.Notifications.requestPermission();
      
      if (granted) {
        setPermission("granted");
        setIsSubscribed(true);
        toast.success("Notificações push ativadas!");
        return true;
      } else {
        setPermission(Notification.permission as PushPermission);
        toast.error("Permissão negada. Habilite nas configurações do dispositivo.");
        return false;
      }
    } catch (e) {
      console.error("Push subscribe error:", e);
      toast.error("Erro ao ativar notificações push. Tente novamente.");
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
