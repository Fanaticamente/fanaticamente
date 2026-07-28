import * as React from "react";

const MOBILE_BREAKPOINT = 1024;

// Allows the Content Manager preview (iframe) to force the mobile layout
const isForcedMobile = () => {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("forceMobile") === "1";
  } catch {
    return false;
  }
};

// Detect if the device is a touch/mobile device (persists across orientation changes)
const isTouchDevice = () => {
  if (typeof window === "undefined") return true;
  return (
    isForcedMobile() ||
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
};

// Get initial value synchronously to avoid flash
const getInitialValue = () => {
  if (typeof window !== "undefined") {
    // On touch devices, always consider mobile (handles landscape rotation)
    if (isTouchDevice()) return true;
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  return true; // Default to mobile for SSR
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue);

  React.useEffect(() => {
    // If it's a touch device, always return true (mobile layout)
    if (isTouchDevice()) {
      setIsMobile(true);
      return;
    }

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
