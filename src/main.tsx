import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: verifica atualizações imediatamente ao abrir o app
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  // Força verificação imediata de atualizações ao abrir o app
  immediate: true,
  onNeedRefresh() {
    // Força atualização automática para garantir que todos vejam a versão mais recente
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

createRoot(document.getElementById("root")!).render(<App />);
