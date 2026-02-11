import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import RankingInfoCard from "@/components/ranking/RankingInfoCard";
import { supabase } from "@/integrations/supabase/client";
import { brazilianClubs, getClubsByLeague } from "@/data/brazilianClubs";

type LeagueTab = "serie_a" | "serie_b" | "serie_c";

const leagueTabs: { key: LeagueTab; label: string }[] = [
  { key: "serie_a", label: "Série A" },
  { key: "serie_b", label: "Série B" },
  { key: "serie_c", label: "Série C" },
];

const Ranking = () => {
  const [activeLeague, setActiveLeague] = useState<LeagueTab>("serie_a");

  // Fetch completed appointments count per club
  const { data: clubCounts = {} } = useQuery({
    queryKey: ["ranking-counts"],
    queryFn: async () => {
      // Get all completed appointments joined with user profiles to get favorite_club_id
      const { data, error } = await supabase
        .from("appointments")
        .select("user_id")
        .eq("status", "concluido");

      if (error) throw error;
      if (!data || data.length === 0) return {};

      // Get unique user_ids
      const userIds = [...new Set(data.map((a) => a.user_id))];

      // Get profiles with favorite clubs for those users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, favorite_club_id")
        .in("user_id", userIds)
        .not("favorite_club_id", "is", null);

      if (profileError) throw profileError;

      // Create a map user_id -> club_id
      const userClubMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        if (p.favorite_club_id) userClubMap[p.user_id] = p.favorite_club_id;
      });

      // Count completed appointments per club
      const counts: Record<string, number> = {};
      data.forEach((appointment) => {
        const clubId = userClubMap[appointment.user_id];
        if (clubId) {
          counts[clubId] = (counts[clubId] || 0) + 1;
        }
      });

      return counts;
    },
    staleTime: 60_000,
  });

  const leagueClubs = getClubsByLeague(activeLeague);

  // Sort: by count desc, then alphabetical
  const sortedClubs = [...leagueClubs].sort((a, b) => {
    const countA = clubCounts[a.id] || 0;
    const countB = clubCounts[b.id] || 0;
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Title Banner */}
        <div className="relative overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #2244aa 0%, #2244aa 30%, #0055ff 30%, #0066ff 100%)' }}>
          {/* Yellow triangle accent */}
          <div className="absolute top-0 left-0 w-24 h-full" style={{ background: '#ffcc00', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          
          <div className="relative flex items-center gap-4 px-5 py-5">
            <Trophy className="w-10 h-10 text-white drop-shadow-lg z-10" />
            <div className="z-10">
              <h1 className="text-xl font-extrabold text-white tracking-wide leading-tight uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                Brasileirão da Saúde Mental
              </h1>
              <p className="text-xs text-blue-200 font-medium">Temporada 2026</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <p className="text-gray-600 text-sm">
            Ranking dos clubes com mais torcedores cuidando da saúde mental
          </p>
        </div>

        {/* League Tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            {leagueTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveLeague(tab.key)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  activeLeague === tab.key
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeLeague === tab.key ? { backgroundColor: '#0066ff' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Header - static */}
        <div className="px-4">
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="flex items-center py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <span className="w-8 text-center">#</span>
                <span className="flex-1 ml-3">Clube</span>
                <span className="w-16 text-center font-extrabold text-gray-700">Pts</span>
                <span className="w-20 text-center">Sessões</span>
                <span className="w-24 text-center">Termômetro</span>
                <span className="w-20 text-center">Cursos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Table Rows */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4">
          <div className="overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="divide-y divide-gray-100">
              {sortedClubs.map((club, index) => {
                const sessions = clubCounts[club.id] || 0;
                const thermometer = 0;
                const courses = 0;
                const total = sessions + thermometer + courses;
                const position = index + 1;
                const isG4 = position <= 4 && total > 0;
                const isZ4 = position > sortedClubs.length - 4 && total === 0;

                return (
                  <div
                    key={club.id}
                    className={`flex items-center py-3 px-3 transition-colors ${
                      isG4
                        ? "bg-emerald-50/60"
                        : isZ4
                        ? "bg-red-50/40"
                        : ""
                    }`}
                  >
                    <span
                      className={`w-8 text-center text-sm font-bold ${
                        isG4
                          ? "text-emerald-600"
                          : isZ4
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {position}
                    </span>

                    <div className="flex items-center gap-3 flex-1 ml-3 min-w-0">
                      <img
                        src={club.badgeUrl}
                        alt={club.name}
                        className="w-8 h-8 object-contain flex-shrink-0"
                        loading="lazy"
                      />
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {club.name}
                      </span>
                    </div>

                    <span className={`w-16 text-center text-sm font-extrabold ${total > 0 ? "text-gray-900" : "text-gray-300"}`}>
                      {total}
                    </span>
                    <span className={`w-20 text-center text-sm font-bold ${sessions > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                      {sessions}
                    </span>
                    <span className={`w-24 text-center text-sm font-bold ${thermometer > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                      {thermometer}
                    </span>
                    <span className={`w-20 text-center text-sm font-bold ${courses > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                      {courses}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 py-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                <span>G-4 — Zona de classificação</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/40" />
                <span>Z-4 — Zona de rebaixamento</span>
              </div>
            </div>
          </div>
          </div>
          <div aria-hidden className="h-20" />
        </div>
      </main>

      <RankingInfoCard />
      <BottomNav />
    </div>
  );
};

export default Ranking;
