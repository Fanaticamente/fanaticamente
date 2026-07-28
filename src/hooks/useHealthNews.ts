import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HealthNewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  image_caption: string | null;
  image_credits: string | null;
  category: string;
  author_name: string | null;
  author_id: string | null;
  is_featured_home: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const useRealtimeInvalidate = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("health-news-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "health_news" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["health-news"] });
          queryClient.invalidateQueries({ queryKey: ["health-news-featured"] });
          queryClient.invalidateQueries({ queryKey: ["health-news-admin"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/** Public list of published health news, ordered by published_at desc */
export const useHealthNews = (limit = 50) => {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: ["health-news", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as HealthNewsItem[];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

/** Featured-on-home health news only */
export const useFeaturedHealthNews = () => {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: ["health-news-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_news")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured_home", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as HealthNewsItem[];
    },
    staleTime: 30 * 1000,
  });
};

/** Admin/marketing list — sees everything */
export const useHealthNewsAdmin = () => {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: ["health-news-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HealthNewsItem[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useHealthNewsItem = (id?: string) => {
  return useQuery({
    queryKey: ["health-news-item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("health_news")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as HealthNewsItem | null;
    },
    enabled: !!id,
  });
};