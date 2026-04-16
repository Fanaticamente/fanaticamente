import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--app-height";

const getViewportHeight = () => {
  if (typeof window === "undefined") return 0;
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
};

const syncViewportHeight = () => {
  if (typeof document === "undefined") return;

  const height = getViewportHeight();
  if (!height) return;

  document.documentElement.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
  document.body.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
};

export const useViewportHeightSync = () => {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let frameId = 0;
    let timeoutId: number | undefined;

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncViewportHeight);
    };

    const scheduleDelayedSync = () => {
      scheduleSync();
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(scheduleSync, 250);
    };

    const viewport = window.visualViewport;

    syncViewportHeight();

    window.addEventListener("resize", scheduleSync);
    window.addEventListener("orientationchange", scheduleDelayedSync);
    document.addEventListener("focusin", scheduleSync);
    document.addEventListener("focusout", scheduleDelayedSync);
    viewport?.addEventListener("resize", scheduleSync);
    viewport?.addEventListener("scroll", scheduleDelayedSync);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);

      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", scheduleDelayedSync);
      document.removeEventListener("focusin", scheduleSync);
      document.removeEventListener("focusout", scheduleDelayedSync);
      viewport?.removeEventListener("resize", scheduleSync);
      viewport?.removeEventListener("scroll", scheduleDelayedSync);
    };
  }, []);
};
