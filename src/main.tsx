import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: atualiza SOMENTE sob comando do usuário
import { registerSW } from "virtual:pwa-register/react";

const updateSW = registerSW({
  immediate: true,
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
