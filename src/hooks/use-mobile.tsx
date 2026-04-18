import * as React from "react";

const MOBILE_BREAKPOINT = 1024;

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
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
};

// Get initial value synchronously to avoid flash
const getInitialValue = () => {
  if (typeof window !== "undefined") {
    // PWA standalone (lojas Apple/Android via WebView): sempre mobile em touch devices
    if (isStandalonePWA() && isTouchDevice()) return true;

    // Navegador (mobile ou desktop): usa apenas o tamanho da janela
    // Isso permite que navegadores mobile vejam o layout desktop responsivo
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  return false; // Default to desktop layout for SSR (responsivo)
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue);

  React.useEffect(() => {
    // PWA standalone em touch device: sempre layout mobile (preserva apps das lojas)
    if (isStandalonePWA() && isTouchDevice()) {
      setIsMobile(true);
      return;
    }

    // Navegador: layout responsivo baseado no tamanho da janela
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
