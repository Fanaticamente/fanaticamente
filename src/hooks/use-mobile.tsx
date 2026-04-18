import * as React from "react";

// Detecta se o app está rodando como PWA standalone (instalado nas lojas via WebView/Capacitor)
const isStandalonePWA = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
};

// Detect if the device is a touch/mobile device (persists across orientation changes)
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
};

// Regra:
// - PWA standalone em touch device (apps das lojas Apple/Android via WebView/Capacitor)
//   → layout MOBILE dedicado (mantém experiência nativa)
// - Qualquer outro acesso (navegador desktop OU navegador mobile como Safari/Chrome em iPhone)
//   → layout DESKTOP (igual ao computador, sem versão responsiva mobile)
const shouldUseMobileLayout = () => {
  if (typeof window === "undefined") return false;
  return isStandalonePWA() && isTouchDevice();
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(shouldUseMobileLayout);

  React.useEffect(() => {
    // Define uma única vez ao montar — o ambiente (PWA vs navegador) não muda durante a sessão
    setIsMobile(shouldUseMobileLayout());
  }, []);

  return isMobile;
}
