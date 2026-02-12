import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import Hls from "hls.js";
import { toast } from "sonner";

export interface RadioStation {
  id: number;
  name: string;
  state: string;
  frequency: string;
  streamUrl?: string;
}

interface RadioContextType {
  playingStation: RadioStation | null;
  isLoading: boolean;
  play: (station: RadioStation) => void;
  stop: () => void;
}

const RadioContext = createContext<RadioContextType | null>(null);

export const useRadio = () => {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
};

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const [playingStation, setPlayingStation] = useState<RadioStation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPlayback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (audioRef.current) {
      const oldAudio = audioRef.current;
      audioRef.current = null;
      oldAudio.pause();
      oldAudio.removeAttribute("src");
      oldAudio.load();
    }
  }, []);

  const stop = useCallback(() => {
    stopPlayback();
    setPlayingStation(null);
    setIsLoading(false);
  }, [stopPlayback]);

  const play = useCallback((station: RadioStation) => {
    if (!station.streamUrl) {
      toast.error("Stream indisponível para esta rádio");
      return;
    }

    // If same station, toggle off
    if (playingStation?.id === station.id) {
      stop();
      return;
    }

    stopPlayback();
    setIsLoading(true);
    setPlayingStation(station);

    const audio = new Audio();
    audioRef.current = audio;
    audio.crossOrigin = "anonymous";
    audio.preload = "none";

    const isHls = station.streamUrl.includes(".m3u8");

    timeoutRef.current = setTimeout(() => {
      stopPlayback();
      toast.error("Tempo esgotado ao conectar. Tente outra rádio.");
      setPlayingStation(null);
      setIsLoading(false);
    }, 12000);

    const playAudio = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (audioRef.current !== audio) return; // stale
      setIsLoading(false);
      audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        toast.error("Não foi possível reproduzir esta rádio");
        setPlayingStation(null);
        setIsLoading(false);
      });
    };

    const onError = () => {
      if (audioRef.current !== audio) return; // stale
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      toast.error("Erro ao conectar com a rádio. Tente novamente.");
      setPlayingStation(null);
      setIsLoading(false);
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.loadSource(station.streamUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => playAudio());
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) onError();
      });
    } else if (isHls && audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = station.streamUrl;
      audio.addEventListener("canplay", playAudio, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.load();
    } else {
      audio.addEventListener("canplay", playAudio, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = station.streamUrl;
      audio.load();
    }
  }, [playingStation, stop, stopPlayback]);

  return (
    <RadioContext.Provider value={{ playingStation, isLoading, play, stop }}>
      {children}
    </RadioContext.Provider>
  );
};
