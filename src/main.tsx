import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: atualiza SOMENTE sob comando do usuário
// Obs: em vite-plugin-pwa, `registerSW` vem de `virtual:pwa-register`.
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  // Não força checagem imediata; só registra e reage quando houver update.
  immediate: false,
  onNeedRefresh() {
    const shouldUpdate = window.confirm(
      "Uma nova versão do app está disponível. Deseja atualizar agora?"
    );
    if (shouldUpdate) updateSW(true);
  },
  onOfflineReady() {
    // opcional: app pronto para uso offline
  },
});

createRoot(document.getElementById("root")!).render(<App />);
