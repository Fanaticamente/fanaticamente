import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAppShellWorker } from "@/lib/pushRegistration";

/**
 * Manager pages must never be interrupted by automatic PWA updates.
 * When the user enters a content-management route, we:
 *  - set a session flag so main.tsx will stop auto-updating
 *  - unregister app-shell workers only (preserve background notifications)
 */
export const useDisableServiceWorkerOnManagerRoutes = () => {
  const location = useLocation();

  const isManagerRoute =
    location.pathname.startsWith("/developer") ||
    location.pathname.startsWith("/desenvolvedor") ||
    location.pathname.startsWith("/marketing");

  useEffect(() => {
    if (!isManagerRoute) return;

    try {
      sessionStorage.setItem("fanatica_disable_sw", "1");
    } catch {
      // ignore
    }

    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((r) => {
          const scriptURL = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          if (isAppShellWorker(scriptURL)) r.unregister();
        });
      })
      .catch(() => {
        // ignore
      });
  }, [isManagerRoute]);
};
