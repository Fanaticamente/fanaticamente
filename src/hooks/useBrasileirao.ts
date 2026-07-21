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
  updated_at: string;
  cached?: boolean;
}

export const useBrasileirao = (enabled: boolean) => {
  return useQuery({
    queryKey: ["brasileirao-serie-a"],
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<BrasileiraoPayload> => {
      const { data, error } = await supabase.functions.invoke("scrape-brasileirao");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao carregar tabela");
      return {
        standings: data.standings ?? [],
        next_round: data.next_round ?? [],
        updated_at: data.updated_at,
        cached: data.cached,
      };
    },
  });
};