import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback, useRef } from "react";

export interface FootballNewsItem {
  id: string;
  original_url: string;
  source_site: string;
  original_title: string;
  rewritten_title: string;
  rewritten_content: string;
  image_url: string | null;
  image_caption: string | null;
  image_credits: string | null;
  category: string;
  published_at: string;
  created_at: string;
  is_original: boolean;
  club_id: string | null;
}

export const useFootballNews = (selectedClub?: string | null) => {
  const queryClient = useQueryClient();
  const lastScrapeRef = useRef<number>(0);

  const fetchNews = async (): Promise<FootballNewsItem[]> => {
    console.log("[useFootballNews] Fetching news from database...", { selectedClub });
    
    let query = supabase
      .from("football_news")
      .select("*")
      .order("published_at", { ascending: false });

    if (selectedClub) {
      // When a club is selected, fetch up to 50 articles for that club
      query = query.eq("club_id", selectedClub).limit(50);
    } else {
      // General feed: fetch latest 30 articles
      query = query.limit(30);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[useFootballNews] Error fetching news:", error);
      throw error;
    }

    console.log(`[useFootballNews] Fetched ${data?.length || 0} articles`);
    return data || [];
  };

  const triggerScrape = useCallback(async () => {
    const now = Date.now();
    if (now - lastScrapeRef.current < 60000) {
      console.log("[useFootballNews] Skipping scrape (debounce)");
      return;
    }
    lastScrapeRef.current = now;

    try {
      console.log("[useFootballNews] Triggering news scrape...");
      const { data, error } = await supabase.functions.invoke("scrape-football-news");
      
      if (error) {
        console.error("[useFootballNews] Scrape error:", error);
        return;
      }
      
      console.log("[useFootballNews] Scrape result:", data);
      queryClient.invalidateQueries({ queryKey: ["football-news"] });
    } catch (err) {
      console.error("[useFootballNews] Failed to trigger scrape:", err);
    }
  }, [queryClient]);

  const forceScrape = useCallback(async () => {
    try {
      console.log("[useFootballNews] Force triggering news scrape...");
      lastScrapeRef.current = Date.now();
      
      const { data, error } = await supabase.functions.invoke("scrape-football-news");
      
      if (error) {
        console.error("[useFootballNews] Scrape error:", error);
        throw error;
      }
      
      console.log("[useFootballNews] Force scrape result:", data);
      await queryClient.invalidateQueries({ queryKey: ["football-news"] });
      
      return data;
    } catch (err) {
      console.error("[useFootballNews] Failed to force scrape:", err);
      throw err;
    }
  }, [queryClient]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("football-news-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "football_news",
        },
        (payload) => {
          console.log("[useFootballNews] Realtime event received:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["football-news"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-scrape every 2 minutes
  useEffect(() => {
    const initialTimeout = setTimeout(triggerScrape, 1000);
    const interval = setInterval(() => {
      triggerScrape();
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [triggerScrape]);

  const queryResult = useQuery({
    queryKey: ["football-news", selectedClub || "all"],
    queryFn: fetchNews,
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    ...queryResult,
    forceScrape,
  };
};
