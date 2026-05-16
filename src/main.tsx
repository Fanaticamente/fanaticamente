import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
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
