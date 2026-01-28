import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Manager pages must never be interrupted by automatic PWA updates.
 * When the user enters /developer* or /desenvolvedor*, we:
 *  - set a session flag so main.tsx will stop auto-updating
 *  - unregister any active service workers (prevents reloads)
 */
export const useDisableServiceWorkerOnManagerRoutes = () => {
  const location = useLocation();

  const isManagerRoute =
    location.pathname.startsWith("/developer") ||
    location.pathname.startsWith("/desenvolvedor");

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
        registrations.forEach((r) => r.unregister());
      })
      .catch(() => {
        // ignore
      });
  }, [isManagerRoute]);
};
