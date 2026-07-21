import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Radio as RadioIcon, Pause, Play, Loader2, MapPin, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useRadio } from "@/contexts/RadioContext";
import { stations } from "./Radio";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// Grade esportiva padrão exibida na página de cada rádio.
// Fonte editorial fictícia — pode ser substituída por dados reais no futuro.
const WEEKLY_SPORTS_SCHEDULE: Record<string, { time: string; program: string }[]> = {
  Segunda:  [
    { time: "07:00", program: "Bom Dia Esporte" },
    { time: "12:00", program: "Mesa Redonda" },
    { time: "19:00", program: "Bola na Rede" },
    { time: "22:00", program: "Resenha da Rodada" },
  ],
  Terça:    [
    { time: "07:00", program: "Bom Dia Esporte" },
    { time: "14:00", program: "Café com Futebol" },
    { time: "20:00", program: "Show de Bola" },
  ],
  Quarta:   [
    { time: "07:00", program: "Bom Dia Esporte" },
    { time: "19:30", program: "Copa em Campo — jogo ao vivo" },
    { time: "22:00", program: "Análise Pós-Jogo" },
  ],
  Quinta:   [
    { time: "07:00", program: "Bom Dia Esporte" },
    { time: "12:00", program: "Mesa Redonda" },
    { time: "20:00", program: "Debate Esportivo" },
  ],
  Sexta:    [
    { time: "07:00", program: "Bom Dia Esporte" },
    { time: "16:00", program: "Pré-Rodada" },
    { time: "21:00", program: "Sexta Esportiva" },
  ],
  Sábado:   [
    { time: "10:00", program: "Sábado no Esporte" },
    { time: "16:00", program: "Jogo ao vivo — Brasileirão" },
    { time: "20:00", program: "Show do Esporte" },
  ],
  Domingo:  [
    { time: "10:00", program: "Domingão Esportivo" },
    { time: "16:00", program: "Jogo ao vivo — Brasileirão" },
    { time: "20:00", program: "Grande Resenha Dominical" },
  ],
};

const RadioStation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playingStation, isLoading, play } = useRadio();

  const station = useMemo(
    () => stations.find((s) => String(s.id) === String(id)),
    [id]
  );

  if (!station) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Rádio" />
        <main className="pt-24 px-4 text-center text-slate-500">
          Rádio não encontrada.
          <div className="mt-4">
            <button
              onClick={() => navigate("/radio")}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm"
            >
              Voltar para Alambrado FM
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const isActive = playingStation?.id === station.id;

  return (
    <div className="min-h-screen bg-white">
      <Header title={station.name} hideSearch />

      <main className="px-4 pt-[calc(56px+1cm)] pb-28">
        {/* Card principal */}
        <section
          className="rounded-3xl p-5 mb-6"
          style={{ background: "var(--club-50)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--club-600)", color: "var(--club-on)" }}
            >
              <RadioIcon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-sans text-lg font-bold text-slate-900 normal-case truncate">
                {station.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{station.state}</span>
                <span>•</span>
                <span>{station.frequency}</span>
              </div>
            </div>
            <button
              onClick={() => play(station)}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--club-600)", color: "var(--club-on)" }}
              aria-label={isActive ? "Pausar" : "Reproduzir"}
            >
              {isActive && isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isActive ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </div>
        </section>

        {/* Programação da semana */}
        <section>
          <h2 className="font-sans text-lg font-bold text-slate-900 normal-case mb-1">
            Programação esportiva
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Confira os horários dos principais programas de esporte da {station.name}.
          </p>

          <div className="space-y-4">
            {DAYS.map((day) => (
              <div
                key={day}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--club-600)" }}
                  />
                  <h3 className="font-sans font-bold text-slate-900 normal-case">
                    {day}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {WEEKLY_SPORTS_SCHEDULE[day].map((p) => (
                    <li key={p.time + p.program} className="flex items-center gap-3">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                        style={{ background: "var(--club-50)", color: "var(--club-700)" }}
                      >
                        <Clock className="w-3 h-3" />
                        {p.time}
                      </div>
                      <span className="text-sm text-slate-700 leading-snug">
                        {p.program}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-6 text-center">
            Programação sujeita a alterações pela emissora.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default RadioStation;