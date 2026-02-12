import { useState, useRef, useEffect } from "react";
import { Radio as RadioIcon, Play, Pause, MapPin, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";

interface RadioStation {
  id: number;
  name: string;
  state: string;
  frequency: string;
  streamUrl?: string;
}

const stations: RadioStation[] = [
  // São Paulo - verified from radio-browser.info
  { id: 1, name: "Rádio Bandeirantes SP", state: "São Paulo", frequency: "90.9 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RadioBandeirantesAAC.aac" },
  { id: 2, name: "Jovem Pan FM", state: "São Paulo", frequency: "100.9 FM", streamUrl: "https://stream.zeno.fm/c45wbq2us3buv" },
  { id: 3, name: "Rádio Transamérica", state: "São Paulo", frequency: "100.1 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RT_SPAAC.aac" },
  { id: 4, name: "CBN São Paulo", state: "São Paulo", frequency: "90.5 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC_SC" },
  { id: 5, name: "BandNews FM SP", state: "São Paulo", frequency: "96.9 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC_SC" },
  // Rio de Janeiro
  { id: 6, name: "Super Rádio Tupi", state: "Rio de Janeiro", frequency: "96.5 FM", streamUrl: "https://8923.brasilstream.com.br/stream" },
  { id: 7, name: "CBN Rio de Janeiro", state: "Rio de Janeiro", frequency: "92.5 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac" },
  // Minas Gerais
  { id: 8, name: "Rádio Itatiaia", state: "Minas Gerais", frequency: "95.7 FM", streamUrl: "https://8903.brasilstream.com.br/stream" },
  { id: 9, name: "Jovem Pan BH", state: "Minas Gerais", frequency: "99.1 FM", streamUrl: "https://8062.brasilstream.com.br/stream" },
  { id: 10, name: "BandNews FM BH", state: "Minas Gerais", frequency: "89.5 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_BHAAC.aac" },
  // Rio Grande do Sul
  { id: 11, name: "Rádio Gaúcha", state: "Rio Grande do Sul", frequency: "93.7 FM", streamUrl: "https://1132747t.ha.azioncdn.net/primary/gaucha_rbs.sdp/playlist.m3u8" },
  { id: 12, name: "Rádio Guaíba", state: "Rio Grande do Sul", frequency: "101.3 FM", streamUrl: "https://liverdguaiba.rbsdirect.com.br/primary/guaiba_rbs.sdp/playlist.m3u8" },
  // Ceará
  { id: 13, name: "CBN Fortaleza", state: "Ceará", frequency: "95.5 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC_SC" },
  // Pernambuco
  { id: 14, name: "Rádio Jornal Recife", state: "Pernambuco", frequency: "780 AM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOJORNALAAC.aac" },
  // Bahia
  { id: 15, name: "CBN Salvador", state: "Bahia", frequency: "100.7 FM", streamUrl: "https://sv1.audiostream.com.br/radio/8030/stream" },
  // Paraná
  { id: 16, name: "CBN Maringá", state: "Paraná", frequency: "95.1 FM", streamUrl: "https://ice.fabricahost.com.br/cbnmaringa" },
  // Distrito Federal
  { id: 17, name: "CBN Brasília", state: "Distrito Federal", frequency: "95.3 FM", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC_SC" },
  // Santa Catarina
  { id: 18, name: "Jovem Pan Floripa", state: "Santa Catarina", frequency: "101.7 FM", streamUrl: "https://live.paineldj.com.br/proxy/jfloripa?mp=/stream" },
  // Campinas
  { id: 19, name: "CBN Campinas", state: "São Paulo", frequency: "99.1 FM", streamUrl: "https://8214.brasilstream.com.br/stream" },
  { id: 20, name: "Bandeirantes Campinas", state: "São Paulo", frequency: "85.7 FM", streamUrl: "https://stm23.xcast.com.br:11284/stream" },
];

const states = [
  "Todos", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Rio Grande do Sul",
  "Ceará", "Pernambuco", "Bahia", "Paraná", "Distrito Federal",
  "Santa Catarina"
];

const Radio = () => {
  const [playingStation, setPlayingStation] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState("Todos");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredStations = stations.filter(
    (station) => selectedState === "Todos" || station.state === selectedState
  );

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = (stationId: number) => {
    if (playingStation === stationId) {
      // Stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setPlayingStation(null);
      setIsLoading(false);
      return;
    }

    const station = stations.find((s) => s.id === stationId);
    if (!station?.streamUrl) {
      toast.error("Stream indisponível para esta rádio");
      return;
    }

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setIsLoading(true);
    setPlayingStation(stationId);

    // Create fresh audio element each time to avoid stale state
    const audio = new Audio();
    audioRef.current = audio;
    audio.crossOrigin = "anonymous";
    audio.preload = "none";

    const cleanup = () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      clearTimeout(timeout);
    };

    const onCanPlay = () => {
      cleanup();
      setIsLoading(false);
      audio.play().catch(() => {
        toast.error("Não foi possível reproduzir esta rádio");
        setPlayingStation(null);
        setIsLoading(false);
      });
    };

    const onError = () => {
      cleanup();
      toast.error("Erro ao conectar com a rádio. Tente novamente.");
      setPlayingStation(null);
      setIsLoading(false);
    };

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      cleanup();
      audio.pause();
      audio.src = "";
      toast.error("Tempo esgotado ao conectar. Tente outra rádio.");
      setPlayingStation(null);
      setIsLoading(false);
    }, 10000);

    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.addEventListener("error", onError, { once: true });

    audio.src = station.streamUrl;
    audio.load();
  };

  const currentStation = stations.find((s) => s.id === playingStation);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Now Playing Bar - fixed at top below header */}
      {currentStation && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+64px)] left-0 right-0 z-40 bg-radio p-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-radio-foreground/20 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-radio-foreground animate-spin" />
            ) : (
              <RadioIcon className="w-5 h-5 text-radio-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-radio-foreground font-medium text-sm truncate">
              {currentStation.name}
            </p>
            <p className="text-radio-foreground/70 text-xs">
              {currentStation.frequency} • {isLoading ? "Conectando..." : "Ao vivo"}
            </p>
          </div>
          <button
            onClick={() => handlePlayPause(currentStation.id)}
            className="w-9 h-9 rounded-full bg-radio-foreground/20 flex items-center justify-center flex-shrink-0"
          >
            <Pause className="w-4 h-4 text-radio-foreground" />
          </button>
        </div>
      )}

      <main className={`px-4 ${currentStation ? 'pt-[calc(env(safe-area-inset-top)+128px)]' : 'pt-20'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-radio/20 flex items-center justify-center">
            <RadioIcon className="w-10 h-10 text-radio" />
          </div>
          <h1 className="font-display text-4xl text-primary mb-2">
            Alambrado <span className="text-radio">FM</span>
          </h1>
          <p className="text-muted-foreground">
            As principais rádios esportivas do Brasil
          </p>
        </div>

        {/* State Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedState === state
                    ? "bg-radio text-radio-foreground"
                    : "bg-card border border-border text-card-foreground hover:border-radio"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Stations List */}
        <div className="space-y-3">
          {filteredStations.map((station) => (
            <button
              key={station.id}
              onClick={() => handlePlayPause(station.id)}
              className={`w-full flex items-center gap-4 bg-card border rounded-xl p-4 transition-all ${
                playingStation === station.id
                  ? "border-radio bg-radio/10"
                  : "border-border hover:border-radio"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  playingStation === station.id
                    ? "bg-radio text-radio-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {playingStation === station.id && isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : playingStation === station.id ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </div>

              <div className="flex-1 text-left">
                <h3 className="text-card-foreground font-medium">
                  {station.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{station.state}</span>
                  <span>•</span>
                  <span>{station.frequency}</span>
                </div>
              </div>

              {playingStation === station.id && !isLoading && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-4 bg-radio rounded-full animate-pulse" />
                  <span className="w-1 h-6 bg-radio rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1 h-3 bg-radio rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Radio;
