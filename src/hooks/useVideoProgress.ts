import { useRef, useEffect, useCallback } from "react";
import { saveLessonDuration } from "./useContinueWatching";

export const STORAGE_PREFIX = "fanatica_video_progress_";
export const DURATION_PREFIX_KEY = "fanatica_video_duration_";

const SAVE_INTERVAL_MS = 3000;

/** Returns the current authenticated user's id from the Supabase cached session. */
const getUserId = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("sb-") && k.endsWith("-auth-token")) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          return parsed?.user?.id ?? null;
        }
      }
    }
  } catch { /* ignore */ }
  return null;
};

/** Build a user-scoped storage key. */
export const buildProgressKey = (lessonId: string): string => {
  const uid = getUserId();
  if (!uid) return `${STORAGE_PREFIX}${lessonId}`;
  return `${STORAGE_PREFIX}${uid}_${lessonId}`;
};

export const buildDurationKey = (lessonId: string): string => {
  const uid = getUserId();
  if (!uid) return `${DURATION_PREFIX_KEY}${lessonId}`;
  return `${DURATION_PREFIX_KEY}${uid}_${lessonId}`;
};

/**
 * Clears all video progress localStorage keys for a specific user.
 * Call this on logout to prevent progress leaking between accounts.
 */
export const clearUserVideoProgress = (userId: string) => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k?.startsWith(`${STORAGE_PREFIX}${userId}_`) ||
        k?.startsWith(`${DURATION_PREFIX_KEY}${userId}_`)
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
};

/**
 * Persiste e restaura a posição de reprodução de um vídeo no localStorage,
 * com as chaves namespacadas por user_id para garantir isolamento entre usuários.
 */
export const useVideoProgress = (lessonId: string | undefined) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveIntervalRef = useRef<number | null>(null);
  const restoredLessonRef = useRef<string | undefined>(undefined);

  // Build user-scoped key dynamically at call time (getUserId reads localStorage)
  const getStorageKey = useCallback(() => {
    return lessonId ? buildProgressKey(lessonId) : null;
  }, [lessonId]);

  // ─── Save / clear progress ──────────────────────────────────────────────────
  const saveProgress = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey || !videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration) return;

    // Always persist real duration so progress % is accurate in "continue watching"
    if (lessonId) saveLessonDuration(lessonId, duration);

    // Seek-to-beginning → clear so the video truly restarts next time
    if (currentTime < 1) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      return;
    }
    // Near the end (within 5s) → clear (considered finished)
    if (duration - currentTime < 5) {
      try {
        localStorage.removeItem(storageKey);
        if (lessonId) localStorage.removeItem(buildDurationKey(lessonId));
      } catch { /* ignore */ }
      return;
    }
    try {
      localStorage.setItem(storageKey, String(currentTime));
    } catch { /* ignore */ }
  }, [getStorageKey, lessonId]);

  // ─── Register video element & attach save listeners ─────────────────────────
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    if (videoRef.current) {
      videoRef.current.removeEventListener("pause", saveProgress);
      videoRef.current.removeEventListener("ended", saveProgress);
      videoRef.current.removeEventListener("seeked", saveProgress);
    }

    videoRef.current = el;

    if (!el) return;

    el.addEventListener("pause", saveProgress);
    el.addEventListener("ended", saveProgress);
    el.addEventListener("seeked", saveProgress);
  }, [saveProgress]);

  // ─── Restore progress once per lesson ───────────────────────────────────────
  useEffect(() => {
    if (!lessonId) return;

    restoredLessonRef.current = undefined;

    const doRestore = () => {
      if (restoredLessonRef.current === lessonId) return;
      restoredLessonRef.current = lessonId;

      const el = videoRef.current;
      if (!el) return;

      if (el.duration && lessonId) saveLessonDuration(lessonId, el.duration);

      try {
        const storageKey = buildProgressKey(lessonId);
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
      doRestore();
    } else {
      el.addEventListener("loadedmetadata", doRestore, { once: true });
      return () => {
        el.removeEventListener("loadedmetadata", doRestore);
      };
    }
  }, [lessonId]);

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
