import { useRef, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "fanatica_video_progress_";
const SAVE_INTERVAL_MS = 3000; // salva a cada 3 segundos

/**
 * Persiste e restaura a posição de reprodução de um vídeo no localStorage.
 * Salva automaticamente a cada 3s, ao pausar e ao perder visibilidade.
 * Restaura quando o vídeo é montado (ou quando lessonId muda).
 */
export const useVideoProgress = (lessonId: string | undefined) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const saveIntervalRef = useRef<number | null>(null);
  const lessonIdRef = useRef<string | undefined>(lessonId);
  const hasRestoredRef = useRef(false);

  // Mantém a ref do lessonId atualizada
  useEffect(() => {
    lessonIdRef.current = lessonId;
    hasRestoredRef.current = false; // reset quando a lição muda
  }, [lessonId]);

  const getStorageKey = useCallback(() => {
    return lessonIdRef.current ? `${STORAGE_PREFIX}${lessonIdRef.current}` : null;
  }, []);

  const saveProgress = useCallback(() => {
    const key = getStorageKey();
    if (!key || !videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration || currentTime < 1) return;
    // Não salva se está nos últimos 5 segundos (considera finalizado)
    if (duration - currentTime < 5) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      return;
    }
    try {
      localStorage.setItem(key, String(currentTime));
    } catch { /* ignore */ }
  }, [getStorageKey]);

  const restoreProgress = useCallback(() => {
    if (hasRestoredRef.current) return;
    const key = getStorageKey();
    if (!key || !videoRef.current) return;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const time = parseFloat(saved);
        if (!isNaN(time) && time > 1) {
          videoRef.current.currentTime = time;
          hasRestoredRef.current = true;
        }
      } else {
        hasRestoredRef.current = true;
      }
    } catch { /* ignore */ }
  }, [getStorageKey]);

  // Tenta restaurar assim que o vídeo tem duração disponível
  const tryRestore = useCallback(() => {
    if (!videoRef.current) return;
    const el = videoRef.current;

    // Se a duração já está disponível, restaura imediatamente
    if (el.readyState >= 1) {
      restoreProgress();
    } else {
      // Aguarda o metadata estar disponível
      const handler = () => {
        restoreProgress();
        el.removeEventListener("loadedmetadata", handler);
      };
      el.addEventListener("loadedmetadata", handler);
    }
  }, [restoreProgress]);

  // Registra o elemento de vídeo e configura os listeners
  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    // Limpa listeners do elemento anterior
    if (videoRef.current) {
      videoRef.current.removeEventListener("pause", saveProgress);
      videoRef.current.removeEventListener("ended", saveProgress);
      videoRef.current.removeEventListener("timeupdate", saveProgress);
    }

    videoRef.current = el;
    hasRestoredRef.current = false;

    if (!el) return;

    // Restaura posição
    tryRestore();

    // Salva ao pausar, terminar e periodicamente via timeupdate
    el.addEventListener("pause", saveProgress);
    el.addEventListener("ended", saveProgress);
  }, [saveProgress, tryRestore]);

  // Salva periodicamente e ao ocultar a aba/app (pausando o vídeo ao sair)
  useEffect(() => {
    saveIntervalRef.current = window.setInterval(saveProgress, SAVE_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Pausa o vídeo e salva a posição ao sair do app/aba
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        saveProgress();
      }
    };

    const handlePageHide = () => {
      // Pausa e salva ao fechar/trocar de página
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      saveProgress();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      if (saveIntervalRef.current !== null) {
        clearInterval(saveIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      // Salva ao desmontar o componente
      saveProgress();
    };
  }, [saveProgress]);

  return { registerVideo };
};
