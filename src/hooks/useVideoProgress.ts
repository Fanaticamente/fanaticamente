import { useRef, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "fanatica_video_progress_";
const SAVE_INTERVAL_MS = 3000;

/**
 * Persiste e restaura a posição de reprodução de um vídeo no localStorage.
 *
 * Design decisions:
 * - Restoration is tracked per-lessonId to guarantee it only happens once per lesson.
 * - The `seeked` event ONLY saves/clears progress — it never restores.
 * - The callback ref registers the DOM element and attaches save listeners.
 * - A separate effect restores progress once per lesson after metadata is ready.
 */
export const useVideoProgress = (lessonId: string | undefined) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveIntervalRef = useRef<number | null>(null);
  // Track which lessonId we've already restored, so we never double-restore.
  const restoredLessonRef = useRef<string | undefined>(undefined);

  const storageKey = lessonId ? `${STORAGE_PREFIX}${lessonId}` : null;

  // ─── Save / clear progress ──────────────────────────────────────────────────
  const saveProgress = useCallback(() => {
    if (!storageKey || !videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration) return;

    // Seek-to-beginning → clear so the video truly restarts next time
    if (currentTime < 1) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      return;
    }
    // Near the end → clear (considered finished)
    if (duration - currentTime < 5) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      return;
    }
    try {
      localStorage.setItem(storageKey, String(currentTime));
    } catch { /* ignore */ }
  }, [storageKey]);

  // ─── Register video element & attach save listeners ─────────────────────────
  // IMPORTANT: does NOT restore here — restoration is handled by the effect below.
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    // Clean up old element
    if (videoRef.current) {
      videoRef.current.removeEventListener("pause", saveProgress);
      videoRef.current.removeEventListener("ended", saveProgress);
      videoRef.current.removeEventListener("seeked", saveProgress);
    }

    videoRef.current = el;

    if (!el) return;

    el.addEventListener("pause", saveProgress);
    el.addEventListener("ended", saveProgress);
    // seeked fires after every user-initiated or programmatic seek;
    // it will clear localStorage when time < 1s (user restarted video).
    el.addEventListener("seeked", saveProgress);
  }, [saveProgress]);

  // ─── Restore progress once per lesson ───────────────────────────────────────
  // This effect runs whenever lessonId changes. It waits for metadata to be
  // ready, then sets currentTime to the saved value exactly once.
  useEffect(() => {
    if (!lessonId || !storageKey) return;

    // Reset restoration gate for the new lesson
    restoredLessonRef.current = undefined;

    const doRestore = () => {
      // Guard: only restore once per lesson
      if (restoredLessonRef.current === lessonId) return;
      restoredLessonRef.current = lessonId;

      const el = videoRef.current;
      if (!el) return;

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const time = parseFloat(saved);
          if (!isNaN(time) && time > 1) {
            el.currentTime = time;
          }
        }
      } catch { /* ignore */ }
    };

    const el = videoRef.current;
    if (!el) return;

    if (el.readyState >= 1) {
      // Metadata already available — restore immediately
      doRestore();
    } else {
      // Wait for metadata
      el.addEventListener("loadedmetadata", doRestore, { once: true });
      return () => {
        el.removeEventListener("loadedmetadata", doRestore);
      };
    }
  }, [lessonId, storageKey]);

  // ─── Periodic save + visibility / page-hide handlers ────────────────────────
  useEffect(() => {
    saveIntervalRef.current = window.setInterval(saveProgress, SAVE_INTERVAL_MS);

  const safePause = () => {
      const el = videoRef.current;
      if (!el || el.paused) return;
      try {
        const p = el.pause() as unknown;
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => { /* ignore AbortError */ });
        }
      } catch { /* ignore */ }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        safePause();
        saveProgress();
      }
    };

    const handlePageHide = () => {
      safePause();
      saveProgress();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      if (saveIntervalRef.current !== null) clearInterval(saveIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      saveProgress();
    };
  }, [saveProgress]);

  return { registerVideo };
};
