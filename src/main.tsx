import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: verifica atualizações imediatamente ao abrir o app
import { registerSW } from "virtual:pwa-register";

const isEmbedMode = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("embed") === "1";
  } catch {
    return false;
  }
};

const isManagerRoute = () => {
  try {
    const path = window.location.pathname;
    return path.startsWith("/developer") || path.startsWith("/desenvolvedor");
  } catch {
    return false;
  }
};

const isServiceWorkerDisabledByManager = () => {
  try {
    return sessionStorage.getItem("fanatica_disable_sw") === "1";
  } catch {
    return false;
  }
};

// IMPORTANT: no modo embed (usado pelo iframe do Gerenciador de Conteúdo)
// E também nas rotas do gerenciador (/developer*), desativamos o service worker.
// Motivo: o ciclo updateSW(true) pode causar loops de reload/remount, quebrando o preview.
if (isEmbedMode() || isManagerRoute() || isServiceWorkerDisabledByManager()) {
  // If a service worker was registered previously, it may still be controlling this page.
  // Unregister it in embed mode to prevent any auto-update/reload behavior.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((r) => r.unregister());
      })
      .catch(() => {
        // ignore
      });
  }
} else if (import.meta.env.PROD) {
  // In dev/preview the PWA update flow can cause refresh loops. Keep SW only in production.
  let alreadyRefreshing = false;

  /**
   * Returns true when it is NOT safe to perform an automatic reload:
   * - user is on a course/lesson page (video may be playing)
   * - a <video> element is currently playing
   * - the manager stability flag is set
   */
  const isSafeToRefresh = () => {
    if (isServiceWorkerDisabledByManager()) return false;
    try {
      const path = window.location.pathname;
      // Never reload on course/lesson pages – video might be playing
      if (path.startsWith("/curso")) return false;
      // Never reload if any video is currently playing
      const videos = document.querySelectorAll("video");
      for (const v of Array.from(videos)) {
        if (!v.paused && !v.ended) return false;
      }
    } catch {
      // ignore
    }
    return true;
  };

  const updateSW = registerSW({
    // Força verificação imediata de atualizações ao abrir o app
    immediate: true,
    onNeedRefresh() {
      if (!isSafeToRefresh()) {
        // Schedule a retry after a delay to catch the update when safe
        setTimeout(() => {
          if (!alreadyRefreshing && isSafeToRefresh()) {
            alreadyRefreshing = true;
            console.log("[PWA] Nova versão disponível, atualizando automaticamente...");
            updateSW(true);
          }
        }, 5 * 60 * 1000); // retry in 5 minutes
        return;
      }
      if (alreadyRefreshing) return;
      alreadyRefreshing = true;
      console.log("[PWA] Nova versão disponível, atualizando automaticamente...");
      updateSW(true);
    },
    onOfflineReady() {
      console.log("[PWA] App pronto para uso offline");
    },
    onRegistered(registration) {
      // Verifica atualizações periodicamente (a cada 1 hora)
      if (registration) {
        setInterval(() => {
          if (isServiceWorkerDisabledByManager()) return;
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
