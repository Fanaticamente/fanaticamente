import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: registra o app offline sem forçar atualização/reload automático
import { registerSW } from "virtual:pwa-register";

// Auto-recovery: se a inicialização do app travar em navegador normal
// (token Supabase corrompido / Service Worker servindo bundle antigo /
// IndexedDB inacessível), limpamos storage + SW + caches e recarregamos UMA vez.
// Isso explica o sintoma "abre em aba anônima mas não no navegador normal".
(function setupBootRecovery() {
  try {
    const RECOVERY_KEY = "fanatica_boot_recovery";
    const BOOT_FLAG = "fanatica_boot_in_progress";

    const alreadyRecovered = sessionStorage.getItem(RECOVERY_KEY) === "1";

    // Marca início do boot. Se a página renderizar com sucesso, App removerá.
    sessionStorage.setItem(BOOT_FLAG, String(Date.now()));

    // Se travar (não montou em 12s), executa recovery uma única vez.
    const watchdog = window.setTimeout(async () => {
      const rootEl = document.getElementById("root");
      const mounted = rootEl && rootEl.childElementCount > 0;
      if (mounted) return;
      if (alreadyRecovered) {
        console.warn("[Boot] Watchdog: app não montou e recovery já foi tentada.");
        return;
      }
      console.warn("[Boot] Watchdog: app travou no boot. Executando recovery...");
      sessionStorage.setItem(RECOVERY_KEY, "1");
      try {
        // Limpa tokens do Supabase (sb-*-auth-token) que podem estar corrompidos
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) { console.warn("[Boot] localStorage clear falhou:", e); }
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch (e) { console.warn("[Boot] SW unregister falhou:", e); }
      try {
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }
      } catch (e) { console.warn("[Boot] cache clear falhou:", e); }
      window.location.reload();
    }, 12000);

    // Quando o React montar, cancela watchdog e limpa flag de boot.
    const cancel = () => {
      window.clearTimeout(watchdog);
      try { sessionStorage.removeItem(BOOT_FLAG); } catch {}
      // Após boot bem-sucedido, libera próxima recovery futura.
      try { sessionStorage.removeItem(RECOVERY_KEY); } catch {}
    };
    // Aguarda primeiro paint do root para considerar boot OK
    window.requestAnimationFrame(() => {
      const check = () => {
        const rootEl = document.getElementById("root");
        if (rootEl && rootEl.childElementCount > 0) cancel();
        else window.setTimeout(check, 250);
      };
      check();
    });
  } catch (e) {
    console.warn("[Boot] setupBootRecovery falhou:", e);
  }
})();

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

  registerSW({
    immediate: false,
    onNeedRefresh() {
      if (alreadyRefreshing) return;
      alreadyRefreshing = true;
      console.log("[PWA] Nova versão disponível; atualização automática desativada.");
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
