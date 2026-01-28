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

// IMPORTANT: no modo embed (usado pelo iframe do Gerenciador de Conteúdo),
// desativamos o registro/auto-update do service worker para evitar reloads em loop.
if (isEmbedMode()) {
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
  const updateSW = registerSW({
    // Força verificação imediata de atualizações ao abrir o app
    immediate: true,
    onNeedRefresh() {
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
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
