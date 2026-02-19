import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PushPermission = "default" | "granted" | "denied";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check for OneSignal availability (more reliable than checking native APIs on iOS)
    const checkSupport = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignalObj = (window as any).OneSignal;
      if (OneSignalObj) {
        setIsSupported(true);
        // Read current state
        try {
          const optedIn = OneSignalObj.User?.PushSubscription?.optedIn;
          if (typeof optedIn === "boolean") setIsSubscribed(optedIn);

          const perm = OneSignalObj.Notifications?.permission;
          if (typeof perm === "boolean") {
            setPermission(perm ? "granted" : "default");
          } else if ("Notification" in window) {
            setPermission(Notification.permission as PushPermission);
          }
        } catch {
          // ignore
        }
      } else if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
        // Fallback: native APIs available even if OneSignal not loaded yet
        setIsSupported(true);
        setPermission(Notification.permission as PushPermission);
      }
    };

    // Check immediately and after a short delay (OneSignal may not be ready yet)
    checkSupport();
    const timer = setTimeout(checkSupport, 2000);
    return () => clearTimeout(timer);
  }, []);

  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignalObj = (window as any).OneSignal;

      if (!OneSignalObj) {
        toast.error("SDK de notificações não carregado. Tente recarregar o app.");
        return false;
      }

      // CRITICAL for iOS: requestPermission() must be called FIRST, synchronously
      // within the user gesture handler — before any await that breaks the gesture chain.
      const permissionPromise = OneSignalObj.Notifications.requestPermission();

      // While permission dialog is open, fetch the user in parallel
      const { data: { user } } = await supabase.auth.getUser();

      // Now await the permission result
      const granted = await permissionPromise;

      if (granted) {
        setPermission("granted");

        // Link OneSignal subscription to our user
        if (user?.id) {
          try {
            await OneSignalObj.login(user.id);
          } catch (loginErr) {
            console.warn("[OneSignal] login error (non-fatal):", loginErr);
          }
        }

        setIsSubscribed(true);
        toast.success("Notificações push ativadas!");
        return true;
      } else {
        const nativePerm = "Notification" in window ? Notification.permission as PushPermission : "denied";
        setPermission(nativePerm);
        toast.error("Permissão negada. Habilite nas configurações do iPhone → Notificações.");
        return false;
      }
    } catch (e) {
      console.error("Push subscribe error:", e);
      toast.error("Erro ao ativar notificações. Verifique as permissões nas configurações do iPhone.");
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
