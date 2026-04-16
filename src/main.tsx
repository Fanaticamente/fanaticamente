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
  let pendingUpdate = false;
  let lastActivityAt = Date.now();
  const INACTIVITY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

  // Track user activity so we never auto-reload on an active session
  const markActive = () => {
    lastActivityAt = Date.now();
  };
  ["pointerdown", "keydown", "touchstart", "focus", "visibilitychange"].forEach((evt) => {
    window.addEventListener(evt, markActive, { passive: true });
  });

  /**
   * Returns true when it is safe to perform an automatic reload:
   * - app is not on a manager-disabled route
   * - user is NOT on a course/lesson page (video may be playing)
   * - no <video> element is currently playing
   * - no professional onboarding draft is in progress (would lose form data)
   * - no input/textarea is currently focused (user is typing)
   * - the app has been inactive for at least INACTIVITY_THRESHOLD_MS (1 hour)
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
      // Never reload while the user is typing in a form
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || active.isContentEditable) {
          return false;
        }
      }
      // Never reload while the professional onboarding wizard has a live draft
      try {
        const draftRaw = localStorage.getItem("professional_onboarding_wizard");
        if (draftRaw) {
          // If the draft exists and is fresh (<7 days), block reload
          const draft = JSON.parse(draftRaw);
          const elapsed = Date.now() - (draft.savedAt ?? 0);
          if (elapsed < 7 * 24 * 60 * 60 * 1000) return false;
        }
      } catch {
        // ignore parse errors
      }
      // Only auto-reload after at least 1h of inactivity in this tab
      if (Date.now() - lastActivityAt < INACTIVITY_THRESHOLD_MS) return false;
    } catch {
      // ignore
    }
    return true;
  };

  const tryApplyUpdate = (updateSW: (reload?: boolean) => Promise<void>) => {
    if (alreadyRefreshing) return;
    if (!isSafeToRefresh()) {
      // Re-check periodically — only apply when conditions allow
      if (!pendingUpdate) {
        pendingUpdate = true;
        const interval = setInterval(() => {
          if (alreadyRefreshing) {
            clearInterval(interval);
            return;
          }
          if (isSafeToRefresh()) {
            clearInterval(interval);
            alreadyRefreshing = true;
            console.log("[PWA] Aplicando atualização após período de inatividade...");
            updateSW(true);
          }
        }, 5 * 60 * 1000); // re-check every 5 minutes
      }
      return;
    }
    alreadyRefreshing = true;
    console.log("[PWA] Nova versão disponível, aplicando após inatividade...");
    updateSW(true);
  };

  const updateSW = registerSW({
    // Força verificação imediata de atualizações ao abrir o app
    immediate: true,
    onNeedRefresh() {
      tryApplyUpdate(updateSW);
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
