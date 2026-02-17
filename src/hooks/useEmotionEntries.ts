import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export interface EmotionEntry {
  id: string;
  user_id: string;
  emotion: string;
  note: string | null;
  entry_date: string;
  created_at: string;
}

export const useEmotionEntries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayEntry, isLoading: loadingToday } = useQuery({
    queryKey: ["emotion-entry-today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emotion_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("entry_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as EmotionEntry | null;
    },
    enabled: !!user,
  });

  const { data: recentEntries = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["emotion-entries-recent", user?.id],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("emotion_entries")
        .select("*")
        .eq("user_id", user!.id)
        .gte("entry_date", sevenDaysAgo)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as EmotionEntry[];
    },
    enabled: !!user,
  });

  const { data: weekStats } = useQuery({
    queryKey: ["emotion-week-stats", user?.id],
    queryFn: async () => {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("emotion_entries")
        .select("emotion")
        .eq("user_id", user!.id)
        .gte("entry_date", weekStart)
        .lte("entry_date", weekEnd);
      if (error) throw error;

      const happy = (data || []).filter((e) =>
        ["muito-feliz", "feliz"].includes(e.emotion)
      ).length;
      const neutral = (data || []).filter((e) => e.emotion === "neutro").length;
      const sad = (data || []).filter((e) =>
        ["triste", "muito-triste"].includes(e.emotion)
      ).length;

      return { happy, neutral, sad };
    },
    enabled: !!user,
  });

  const saveEntry = useMutation({
    mutationFn: async ({ emotion, note }: { emotion: string; note: string }) => {
      if (todayEntry) {
        const { error } = await supabase
          .from("emotion_entries")
          .update({ emotion, note: note || null })
          .eq("id", todayEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("emotion_entries")
          .insert({ user_id: user!.id, emotion, note: note || null, entry_date: today });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emotion-entry-today"] });
      queryClient.invalidateQueries({ queryKey: ["emotion-entries-recent"] });
      queryClient.invalidateQueries({ queryKey: ["emotion-week-stats"] });
    },
  });

  return {
    todayEntry,
    recentEntries,
    weekStats: weekStats || { happy: 0, neutral: 0, sad: 0 },
    isLoading: loadingToday || loadingRecent,
    saveEntry,
  };
};
