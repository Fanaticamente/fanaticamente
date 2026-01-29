import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";

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

  const fetchNews = async (): Promise<FootballNewsItem[]> => {
    const { data, error } = await supabase
      .from("football_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching news:", error);
      throw error;
    }

    return data || [];
  };

  const triggerScrape = useCallback(async () => {
    try {
      console.log("Triggering news scrape...");
      const { data, error } = await supabase.functions.invoke("scrape-football-news");
      
      if (error) {
        console.error("Scrape error:", error);
        return;
      }
      
      console.log("Scrape result:", data);
      
      // Refresh the news list
      if (data?.processed > 0) {
        queryClient.invalidateQueries({ queryKey: ["football-news"] });
      }
    } catch (err) {
      console.error("Failed to trigger scrape:", err);
    }
  }, [queryClient]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("football-news-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "football_news",
        },
        () => {
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
    // Initial scrape on mount
    triggerScrape();

    // Set up interval for every 2 minutes
    const interval = setInterval(triggerScrape, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [triggerScrape]);

  return useQuery({
    queryKey: ["football-news"],
    queryFn: fetchNews,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};
