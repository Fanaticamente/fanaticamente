import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio as RadioIcon, Play, Pause, MapPin, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useRadio, type RadioStation } from "@/contexts/RadioContext";

export const stations: RadioStation[] = [
  // São Paulo
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
  { id: 12, name: "Rádio Guaíba", state: "Rio Grande do Sul", frequency: "101.3 FM", streamUrl: "https://radio.saopaulo01.com.br:10827/stream" },
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
  const { playingStation, isLoading, play } = useRadio();
  const [selectedState, setSelectedState] = useState("Todos");
  const navigate = useNavigate();

  const filteredStations = stations.filter(
    (station) => selectedState === "Todos" || station.state === selectedState
  );

  const handleStationClick = (station: RadioStation) => {
    if (playingStation?.id !== station.id) {
      play(station);
    }
    navigate(`/radio/${station.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="Alambrado FM" hideSearch />

      {/* Now Playing Bar - fixed at top below header */}
      {playingStation && (
        <div
          onClick={() => navigate(`/radio/${playingStation.id}`)}
          className="fixed top-[calc(env(safe-area-inset-top)+56px)] left-0 right-0 z-40 p-3 flex items-center gap-4 cursor-pointer"
          style={{ background: "var(--club-600)", color: "var(--club-on)" }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RadioIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{playingStation.name}</p>
            <p className="text-xs opacity-80">
              {playingStation.frequency} • {isLoading ? "Conectando..." : "Ao vivo"}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); play(playingStation); }}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className={`px-4 ${playingStation ? 'pt-[calc(env(safe-area-inset-top)+144px)]' : 'pt-20'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "var(--club-100)" }}
          >
            <RadioIcon className="w-9 h-9" style={{ color: "var(--club-600)" }} />
          </div>
          <h1 className="font-sans font-semibold text-2xl text-slate-900 normal-case">
            Alambrado FM
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            As principais rádios esportivas do Brasil
          </p>
        </div>

        {/* State Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {states.map((state) => {
              const active = selectedState === state;
              return (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border"
                  style={
                    active
                      ? { background: "var(--club-600)", color: "var(--club-on)", borderColor: "var(--club-600)" }
                      : { background: "white", color: "#0f172a", borderColor: "#e2e8f0" }
                  }
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stations List */}
        <div className="space-y-3">
          {filteredStations.map((station) => {
            const active = playingStation?.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => handleStationClick(station)}
                className="w-full flex items-center gap-4 rounded-2xl p-4 transition-all border bg-white"
                style={
                  active
                    ? { borderColor: "var(--club-600)", background: "var(--club-50)" }
                    : { borderColor: "#e2e8f0" }
                }
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  style={
                    active
                      ? { background: "var(--club-600)", color: "var(--club-on)" }
                      : { background: "#f1f5f9", color: "#475569" }
                  }
                >
                  {active && isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : active ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-slate-900 font-semibold truncate normal-case">
                    {station.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span>{station.state}</span>
                    <span>•</span>
                    <span>{station.frequency}</span>
                  </div>
                </div>

                {active && !isLoading && (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-4 rounded-full animate-pulse" style={{ background: "var(--club-600)" }} />
                    <span className="w-1 h-6 rounded-full animate-pulse" style={{ background: "var(--club-600)", animationDelay: "0.1s" }} />
                    <span className="w-1 h-3 rounded-full animate-pulse" style={{ background: "var(--club-600)", animationDelay: "0.2s" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Radio;
