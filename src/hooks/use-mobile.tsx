import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Detect if the app is running as an installed PWA (standalone mode)
const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true // iOS Safari
  );
};

// Get initial value synchronously to avoid flash
const getInitialValue = () => {
  if (typeof window !== "undefined") {
    // Only show mobile layout for installed PWA users
    if (isStandaloneMode()) return true;
    // Browser users always get desktop layout, even on mobile devices
    return false;
  }
  return false; // Default to desktop for SSR
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue);

  React.useEffect(() => {
    // Installed PWA → always mobile layout
    if (isStandaloneMode()) {
      setIsMobile(true);
      return;
    }

    // Browser users → always desktop layout regardless of screen size
    setIsMobile(false);
  }, []);

  return isMobile;
}
