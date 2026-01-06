import { useState } from "react";
import { Radio as RadioIcon, Play, Pause, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface RadioStation {
  id: number;
  name: string;
  state: string;
  frequency: string;
  isPlaying?: boolean;
}

const stations: RadioStation[] = [
  { id: 1, name: "Rádio Globo SP", state: "São Paulo", frequency: "1100 AM" },
  { id: 2, name: "Rádio Bandeirantes", state: "São Paulo", frequency: "840 AM" },
  { id: 3, name: "Super Rádio Tupi", state: "Rio de Janeiro", frequency: "1280 AM" },
  { id: 4, name: "Rádio Itatiaia", state: "Minas Gerais", frequency: "610 AM" },
  { id: 5, name: "Rádio Gaúcha", state: "Rio Grande do Sul", frequency: "600 AM" },
  { id: 6, name: "Rádio Guaíba", state: "Rio Grande do Sul", frequency: "720 AM" },
  { id: 7, name: "Rádio CBN", state: "Nacional", frequency: "780 AM" },
  { id: 8, name: "Rádio Jovem Pan", state: "São Paulo", frequency: "620 AM" },
  { id: 9, name: "Rádio Transamérica", state: "São Paulo", frequency: "100.1 FM" },
  { id: 10, name: "Rádio Verdes Mares", state: "Ceará", frequency: "810 AM" },
  { id: 11, name: "Rádio Jornal", state: "Pernambuco", frequency: "780 AM" },
  { id: 12, name: "Rádio Metrópole", state: "Bahia", frequency: "101.3 FM" },
];

const states = ["Todos", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Rio Grande do Sul", "Nacional"];

const Radio = () => {
  const [playingStation, setPlayingStation] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState("Todos");

  const filteredStations = stations.filter(
    (station) => selectedState === "Todos" || station.state === selectedState
  );

  const handlePlayPause = (stationId: number) => {
    if (playingStation === stationId) {
      setPlayingStation(null);
    } else {
      setPlayingStation(stationId);
    }
  };

  const currentStation = stations.find((s) => s.id === playingStation);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-32 px-4">
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
                {playingStation === station.id ? (
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

              {playingStation === station.id && (
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
        <div aria-hidden className="h-[calc(6.5rem+env(safe-area-inset-bottom))]" />
      </main>

      {/* Now Playing Bar */}
      {currentStation && (
        <div className="fixed bottom-16 left-0 right-0 bg-radio p-4 flex items-center gap-4 animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-radio-foreground/20 flex items-center justify-center">
            <RadioIcon className="w-6 h-6 text-radio-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-radio-foreground font-medium">
              {currentStation.name}
            </p>
            <p className="text-radio-foreground/70 text-sm">
              {currentStation.frequency} • Ao vivo
            </p>
          </div>
          <button
            onClick={() => setPlayingStation(null)}
            className="w-10 h-10 rounded-full bg-radio-foreground/20 flex items-center justify-center"
          >
            <Pause className="w-5 h-5 text-radio-foreground" />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Radio;
