import { useRef, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "fanatica_video_progress_";
const SAVE_INTERVAL_MS = 5000; // salva a cada 5 segundos

/**
 * Persiste e restaura a posição de reprodução de um vídeo no localStorage.
 * Salva automaticamente a cada 5s e ao perder visibilidade.
 * Restaura quando o vídeo é montado (ou quando lessonId muda).
 */
export const useVideoProgress = (lessonId: string | undefined) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveIntervalRef = useRef<number | null>(null);

  const storageKey = lessonId ? `${STORAGE_PREFIX}${lessonId}` : null;

  // Salva a posição atual
  const saveProgress = useCallback(() => {
    if (!storageKey || !videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration || currentTime < 1) return;
    // Não salva se está nos últimos 3 segundos (considera finalizado)
    if (duration - currentTime < 3) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      return;
    }
    try {
      localStorage.setItem(storageKey, String(currentTime));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Restaura a posição salva quando o vídeo estiver pronto para reproduzir
  const restoreProgress = useCallback(() => {
    if (!storageKey || !videoRef.current) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const time = parseFloat(saved);
        if (!isNaN(time) && time > 1) {
          videoRef.current.currentTime = time;
        }
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  // Configura os event listeners no elemento de vídeo
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    // Remove listeners do elemento anterior
    if (videoRef.current) {
      videoRef.current.removeEventListener("loadedmetadata", restoreProgress);
      videoRef.current.removeEventListener("pause", saveProgress);
      videoRef.current.removeEventListener("ended", saveProgress);
    }

    videoRef.current = el;

    if (!el) return;

    el.addEventListener("loadedmetadata", restoreProgress);
    el.addEventListener("pause", saveProgress);
    el.addEventListener("ended", saveProgress);
  }, [restoreProgress, saveProgress]);

  // Salva periodicamente e ao ocultar a aba/app
  useEffect(() => {
    if (!storageKey) return;

    saveIntervalRef.current = window.setInterval(saveProgress, SAVE_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveProgress);

    return () => {
      if (saveIntervalRef.current !== null) {
        clearInterval(saveIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveProgress);
    };
  }, [storageKey, saveProgress]);

  return { registerVideo };
};
