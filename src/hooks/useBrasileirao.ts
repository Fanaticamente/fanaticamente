import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StandingRow {
  position: number;
  club: string;
  abbr: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
}

export interface NextMatch {
  date: string;
  weekday?: string;
  time?: string;
  venue?: string;
  home: string;
  home_abbr?: string;
  away: string;
  away_abbr?: string;
}

export interface BrasileiraoPayload {
  standings: StandingRow[];
  next_round: NextMatch[];
  matches?: MatchRow[];
  updated_at: string;
  cached?: boolean;
}

export interface MatchRow {
  id: string;
  round: number | null;
  utcTime: string | null;
  home: string;
  home_abbr: string;
  away: string;
  away_abbr: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished" | "cancelled";
  live_minute: string | null;
  score_str: string | null;
}

export const useBrasileirao = (enabled: boolean) => {
  return useQuery({
    queryKey: ["brasileirao-serie-a"],
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const d = query.state.data as BrasileiraoPayload | undefined;
      const hasLive = d?.matches?.some((m) => m.status === "live");
      // Live: 60s. Otherwise: 5 minutes (per user request).
      return hasLive ? 60 * 1000 : 5 * 60 * 1000;
    },
    queryFn: async (): Promise<BrasileiraoPayload> => {
      const { data, error } = await supabase.functions.invoke("scrape-brasileirao");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao carregar tabela");
      return {
        standings: data.standings ?? [],
        next_round: data.next_round ?? [],
        matches: data.matches ?? [],
        updated_at: data.updated_at,
        cached: data.cached,
      };
    },
  });
};