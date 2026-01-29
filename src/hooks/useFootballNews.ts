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
}

export const useFootballNews = () => {
  const queryClient = useQueryClient();
  const lastScrapeRef = useRef<number>(0);

  const fetchNews = async (): Promise<FootballNewsItem[]> => {
    console.log("[useFootballNews] Fetching news from database...");
    const { data, error } = await supabase
      .from("football_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[useFootballNews] Error fetching news:", error);
      throw error;
    }

    console.log(`[useFootballNews] Fetched ${data?.length || 0} articles`);
    return data || [];
  };

  const triggerScrape = useCallback(async () => {
    // Debounce: don't scrape if we scraped in the last 60 seconds
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
      
      // Always refresh after scrape to ensure UI is up to date
      queryClient.invalidateQueries({ queryKey: ["football-news"] });
    } catch (err) {
      console.error("[useFootballNews] Failed to trigger scrape:", err);
    }
  }, [queryClient]);

  // Force scrape without debounce - for manual refresh button
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
      
      // Refresh after scrape
      await queryClient.invalidateQueries({ queryKey: ["football-news"] });
      
      return data;
    } catch (err) {
      console.error("[useFootballNews] Failed to force scrape:", err);
      throw err;
    }
  }, [queryClient]);

  // Set up realtime subscription for new articles
  useEffect(() => {
    console.log("[useFootballNews] Setting up realtime subscription...");
    
    const channel = supabase
      .channel("football-news-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "football_news",
        },
        (payload) => {
          console.log("[useFootballNews] Realtime event received:", payload.eventType);
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ queryKey: ["football-news"] });
        }
      )
      .subscribe((status) => {
        console.log("[useFootballNews] Realtime subscription status:", status);
      });

    return () => {
      console.log("[useFootballNews] Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-scrape every 2 minutes
  useEffect(() => {
    console.log("[useFootballNews] Setting up auto-scrape interval (2 min)");
    
    // Initial scrape on mount (with small delay to not block UI)
    const initialTimeout = setTimeout(triggerScrape, 1000);

    // Set up interval for every 2 minutes
    const interval = setInterval(() => {
      console.log("[useFootballNews] Auto-scrape interval triggered");
      triggerScrape();
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [triggerScrape]);

  const queryResult = useQuery({
    queryKey: ["football-news"],
    queryFn: fetchNews,
    staleTime: 30 * 1000, // 30 seconds - more aggressive refresh
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes as backup
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  return {
    ...queryResult,
    forceScrape,
  };
};
