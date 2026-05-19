import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--app-height";

const getViewportHeight = () => {
  if (typeof window === "undefined") return 0;
  return Math.round(window.innerHeight || document.documentElement.clientHeight);
};

const isEditingField = () => {
  if (typeof document === "undefined") return false;
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  return activeElement.matches("input, textarea, select, [contenteditable='true']");
};

const syncViewportHeight = (allowShrink = false) => {
  if (typeof document === "undefined") return;

  const height = getViewportHeight();
  if (!height) return;

  const currentHeight = Number.parseInt(
    document.documentElement.style.getPropertyValue(VIEWPORT_HEIGHT_VAR),
    10,
  );

  if (!allowShrink && currentHeight && height < currentHeight && isEditingField()) return;

  document.documentElement.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
  document.body.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
};

export const useViewportHeightSync = () => {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let frameId = 0;
    let timeoutIds: number[] = [];

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => syncViewportHeight(false));
    };

    const scheduleForcedSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => syncViewportHeight(true));
    };

    const scheduleDelayedSync = () => {
      scheduleSync();
      timeoutIds.forEach(window.clearTimeout);
      timeoutIds = [150, 450, 900].map((delay) => window.setTimeout(scheduleForcedSync, delay));
    };

    syncViewportHeight();

    window.addEventListener("resize", scheduleSync);
    window.addEventListener("orientationchange", scheduleDelayedSync);
    document.addEventListener("focusout", scheduleDelayedSync);

    return () => {
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach(window.clearTimeout);

      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", scheduleDelayedSync);
      document.removeEventListener("focusout", scheduleDelayedSync);
    };
  }, []);
};
