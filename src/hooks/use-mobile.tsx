import * as React from "react";

// Detecta apps nativos empacotados via Capacitor (lojas Apple/Android)
const isCapacitorApp = () => {
  if (typeof window === "undefined") return false;
  return (
    !!(window as any).Capacitor ||
    /(capacitor)\//i.test(navigator.userAgent || "") ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:"
  );
};

// Detecta se o app está rodando como PWA standalone (instalado via "Adicionar à tela inicial")
const isStandalonePWA = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
};

// Detect if the device is a touch/mobile device
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
};

// Regra:
// - App nativo (Capacitor) das lojas Apple/Android → layout MOBILE
// - PWA standalone em touch device → layout MOBILE
// - Qualquer navegador (desktop OU mobile como Safari/Chrome) → layout DESKTOP responsivo
const shouldUseMobileLayout = () => {
  if (typeof window === "undefined") return false;
  if (isCapacitorApp()) return true;
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
