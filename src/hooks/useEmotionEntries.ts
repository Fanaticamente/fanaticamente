import { useState, useEffect } from "react";
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

const ANON_EMOTIONS_KEY = "anon-emotion-entries";

const getAnonEntries = (): EmotionEntry[] => {
  try {
    const stored = localStorage.getItem(ANON_EMOTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveAnonEntries = (entries: EmotionEntry[]) => {
  localStorage.setItem(ANON_EMOTIONS_KEY, JSON.stringify(entries));
};

export const useEmotionEntries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Anonymous state
  const [anonEntries, setAnonEntries] = useState<EmotionEntry[]>([]);
  useEffect(() => {
    if (!user) setAnonEntries(getAnonEntries());
  }, [user]);

  const { data: todayEntryDB, isLoading: loadingTodayDB } = useQuery({
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
    // TEMP: desabilitado para permitir múltiplos preenchimentos por dia durante testes
    enabled: false,
  });

  const { data: recentEntriesDB = [], isLoading: loadingRecentDB } = useQuery({
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

  // Anonymous computed values
  const anonTodayEntry = !user ? anonEntries.find(e => e.entry_date === today) || null : null;
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const anonRecentEntries = !user ? anonEntries.filter(e => e.entry_date >= sevenDaysAgo) : [];
  const anonWeekStats = !user ? (() => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEntries = anonEntries.filter(e => e.entry_date >= weekStart && e.entry_date <= weekEnd);
    return {
      happy: weekEntries.filter(e => ["muito-feliz", "feliz"].includes(e.emotion)).length,
      neutral: weekEntries.filter(e => e.emotion === "neutro").length,
      sad: weekEntries.filter(e => ["triste", "muito-triste"].includes(e.emotion)).length,
    };
  })() : null;

  const saveEntry = useMutation({
    mutationFn: async ({ emotion, note }: { emotion: string; note: string }) => {
      if (user) {
        const todayEntry = todayEntryDB;
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
      } else {
        // Anonymous: save to localStorage
        const entries = getAnonEntries();
        const existingIdx = entries.findIndex(e => e.entry_date === today);
        const entry: EmotionEntry = {
          id: crypto.randomUUID(),
          user_id: "anon",
          emotion,
          note: note || null,
          entry_date: today,
          created_at: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          entries[existingIdx] = { ...entries[existingIdx], emotion, note: note || null };
        } else {
          entries.push(entry);
        }
        saveAnonEntries(entries);
        setAnonEntries([...entries]);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["emotion-entry-today"] });
        queryClient.invalidateQueries({ queryKey: ["emotion-entries-recent"] });
        queryClient.invalidateQueries({ queryKey: ["emotion-week-stats"] });
      }
    },
  });

  return {
    todayEntry: user ? todayEntryDB : anonTodayEntry,
    recentEntries: user ? recentEntriesDB : anonRecentEntries,
    weekStats: (user ? weekStats : anonWeekStats) || { happy: 0, neutral: 0, sad: 0 },
    isLoading: user ? (loadingTodayDB || loadingRecentDB) : false,
    saveEntry,
  };
};
