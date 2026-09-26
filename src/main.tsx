import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { IS_PREVIEW_FRAME } from "./lib/previewMode";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";

// Dentro do iframe de preview do Gerenciador Mobile não mexemos em service
// workers: o registro é por origem e afetaria a janela do gerenciador.
if (!IS_PREVIEW_FRAME && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        const scriptUrl = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || "";
        if (!scriptUrl.endsWith("/sw-push.js")) registration.unregister();
      });
    })
    .catch(() => {
      // ignore
    });
}

createRoot(document.getElementById("root")!).render(<App />);
