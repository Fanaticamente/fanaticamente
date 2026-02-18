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
 * Core save logic — writes currentTime + duration to localStorage.
 * Returns true if saved, false if cleared (finished/reset).
 */
const doSave = (lessonId: string, el: HTMLVideoElement) => {
  const { currentTime, duration } = el;
  if (!duration || isNaN(duration) || duration === 0) return;

  const storageKey = buildProgressKey(lessonId);

  // Always persist real duration so progress % is accurate in "continue watching"
  saveLessonDuration(lessonId, duration);

  // Near the beginning → clear (user rewound)
  if (currentTime < 1) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    return;
  }
  // Near the end (within 5s) → clear (considered finished)
  if (duration - currentTime < 5) {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(buildDurationKey(lessonId));
    } catch { /* ignore */ }
    return;
  }
  try {
    localStorage.setItem(storageKey, String(currentTime));
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
  // Throttle ref for timeupdate (fires ~4x/sec) — only save at most every 2s via this event
  const lastTimeupdateSaveRef = useRef<number>(0);

  // ─── Immediate save (pause, ended, seeked, visibility hide) ─────────────────
  const saveNow = useCallback(() => {
    if (!lessonId || !videoRef.current) return;
    doSave(lessonId, videoRef.current);
  }, [lessonId]);

  // ─── Throttled save for timeupdate ──────────────────────────────────────────
  const saveThrottled = useCallback(() => {
    if (!lessonId || !videoRef.current) return;
    const now = Date.now();
    if (now - lastTimeupdateSaveRef.current < 2000) return;
    lastTimeupdateSaveRef.current = now;
    doSave(lessonId, videoRef.current);
  }, [lessonId]);

  // ─── Safe pause (suppresses AbortError from play/pause race) ────────────────
  const safePause = useCallback(() => {
    const el = videoRef.current;
    if (!el || el.paused) return;
    try {
      const p = el.pause() as unknown;
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => { /* ignore AbortError */ });
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Register video element & attach save listeners ─────────────────────────
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    if (videoRef.current) {
      videoRef.current.removeEventListener("pause", saveNow);
      videoRef.current.removeEventListener("ended", saveNow);
      videoRef.current.removeEventListener("seeked", saveNow);
      videoRef.current.removeEventListener("timeupdate", saveThrottled);
    }

    videoRef.current = el;

    if (!el) return;

    el.addEventListener("pause", saveNow);
    el.addEventListener("ended", saveNow);
    el.addEventListener("seeked", saveNow);
    // timeupdate fires ~4x/sec while playing — throttled to avoid excessive writes
    el.addEventListener("timeupdate", saveThrottled);
  }, [saveNow, saveThrottled]);

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
    saveIntervalRef.current = window.setInterval(saveNow, SAVE_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        safePause();
        saveNow();
      }
    };

    const handlePageHide = () => {
      safePause();
      saveNow();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      if (saveIntervalRef.current !== null) clearInterval(saveIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      saveNow();
    };
  }, [saveNow, safePause]);

  return { registerVideo };
};
