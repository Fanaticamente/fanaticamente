import { useRef, useEffect, useCallback } from "react";
import { saveLessonDuration, saveProgressToDb } from "./useContinueWatching";

export const STORAGE_PREFIX = "fanatica_video_progress_";
export const DURATION_PREFIX_KEY = "fanatica_video_duration_";

const SAVE_INTERVAL_MS = 3000;
const DB_SAVE_INTERVAL_MS = 10000; // Salva no banco a cada 10s para não sobrecarregar

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
 * Mantido para compatibilidade, mas não apaga mais o localStorage no logout
 * pois o progresso é persistido no banco e restaurado ao fazer login novamente.
 */
export const clearUserVideoProgress = (_userId: string) => {
  // no-op: progresso é salvo no banco, não deve ser apagado no logout
};

/**
 * Core save logic — writes currentTime + duration to localStorage.
 * Optionally also saves to DB (fire-and-forget).
 */
const doSave = (lessonId: string, el: HTMLVideoElement, saveToDb = false) => {
  const { currentTime, duration } = el;
  if (!duration || isNaN(duration) || duration === 0) return;

  const storageKey = buildProgressKey(lessonId);

  // Always persist real duration so progress % is accurate in "continue watching"
  saveLessonDuration(lessonId, duration);

  // Near the beginning → clear (user rewound)
  if (currentTime < 1) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    if (saveToDb) saveProgressToDb(lessonId, 0, duration);
    return;
  }
  // Near the end (within 5s) → clear (considered finished)
  if (duration - currentTime < 5) {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(buildDurationKey(lessonId));
    } catch { /* ignore */ }
    if (saveToDb) saveProgressToDb(lessonId, duration, duration);
    return;
  }
  try {
    localStorage.setItem(storageKey, String(currentTime));
  } catch { /* ignore */ }
  if (saveToDb) saveProgressToDb(lessonId, currentTime, duration);
};

/**
 * Persiste e restaura a posição de reprodução de um vídeo.
 * localStorage = instantâneo (UX); DB = persistência entre sessões/dispositivos.
 */
export const useVideoProgress = (lessonId: string | undefined) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveIntervalRef = useRef<number | null>(null);
  const dbSaveIntervalRef = useRef<number | null>(null);
  const restoredLessonRef = useRef<string | undefined>(undefined);
  const lastTimeupdateSaveRef = useRef<number>(0);

  // ─── Save localStorage only (para eventos de DOM) ─────────────────────────
  const saveNow = useCallback(() => {
    if (!lessonId || !videoRef.current) return;
    doSave(lessonId, videoRef.current, false);
  }, [lessonId]);

  // ─── Save localStorage + DB (para interval e eventos de saída) ────────────
  const saveNowWithDb = useCallback(() => {
    if (!lessonId || !videoRef.current) return;
    doSave(lessonId, videoRef.current, true);
  }, [lessonId]);

  // ─── Throttled save for timeupdate (localStorage only) ────────────────────
  const saveThrottled = useCallback(() => {
    if (!lessonId || !videoRef.current) return;
    const now = Date.now();
    if (now - lastTimeupdateSaveRef.current < 2000) return;
    lastTimeupdateSaveRef.current = now;
    doSave(lessonId, videoRef.current, false);
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

  // ─── Periodic save (localStorage) + DB save interval + visibility handlers ──
  useEffect(() => {
    // localStorage save a cada 3s
    saveIntervalRef.current = window.setInterval(saveNow, SAVE_INTERVAL_MS);
    // DB save a cada 10s (fire-and-forget para persistência entre sessões)
    dbSaveIntervalRef.current = window.setInterval(saveNowWithDb, DB_SAVE_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        safePause();
        saveNowWithDb(); // Salva no banco ao minimizar/trocar de aba
      }
    };

    const handlePageHide = () => {
      safePause();
      saveNowWithDb(); // Salva no banco ao fechar/navegar
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      if (saveIntervalRef.current !== null) clearInterval(saveIntervalRef.current);
      if (dbSaveIntervalRef.current !== null) clearInterval(dbSaveIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      saveNowWithDb(); // Salva no banco ao desmontar (trocar de aula ou sair)
    };
  }, [saveNow, saveNowWithDb, safePause]);

  return { registerVideo };
};
