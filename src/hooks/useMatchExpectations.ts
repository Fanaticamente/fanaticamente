import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";

export interface UpcomingMatch {
  id: string;
  club_id: string;
  opponent: string;
  match_date: string;
  match_time: string | null;
  competition: string | null;
  is_home: boolean;
}

export interface MatchExpectation {
  id: string;
  user_id: string;
  match_id: string;
  confidence_level: string;
  pre_match_feeling: string | null;
  win_impact: string | null;
  loss_impact: string | null;
}

export const useMatchExpectations = (userClubId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Get matches for user's club happening tomorrow or today
  const { data: upcomingMatch } = useQuery({
    queryKey: ["upcoming-match", userClubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upcoming_matches")
        .select("*")
        .eq("club_id", userClubId!)
        .gte("match_date", today)
        .lte("match_date", tomorrow)
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as UpcomingMatch | null;
    },
    enabled: !!userClubId,
  });

  // Check if user already answered for this match
  const { data: existingExpectation } = useQuery({
    queryKey: ["match-expectation", upcomingMatch?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_expectations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("match_id", upcomingMatch!.id)
        .maybeSingle();
      if (error) throw error;
      return data as MatchExpectation | null;
    },
    enabled: !!user && !!upcomingMatch,
  });

  const saveExpectation = useMutation({
    mutationFn: async (data: {
      confidence_level: string;
      pre_match_feeling?: string;
      win_impact?: string;
      loss_impact?: string;
    }) => {
      const { error } = await supabase
        .from("match_expectations")
        .insert({
          user_id: user!.id,
          match_id: upcomingMatch!.id,
          ...data,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-expectation"] });
    },
  });

  return {
    upcomingMatch,
    existingExpectation,
    saveExpectation,
    showMatchCard: !!upcomingMatch && !existingExpectation,
  };
};
