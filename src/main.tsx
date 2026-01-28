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
if (!isEmbedMode()) {
  const updateSW = registerSW({
    // Força verificação imediata de atualizações ao abrir o app
    immediate: true,
    onNeedRefresh() {
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
