import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AppPage {
  id: string;
  page_id: string;
  name: string;
  path: string;
  icon: string;
  description: string | null;
  is_visible: boolean;
  is_public: boolean;
  platform: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useAppPages = (platform?: string) => {
  return useQuery({
    queryKey: ["app-pages", platform],
    queryFn: async () => {
      let query = supabase
        .from("app_pages")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (platform && platform !== "all") {
        query = query.or(`platform.eq.${platform},platform.eq.both`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AppPage[];
    },
  });
};

export const useTogglePageVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { data, error } = await supabase
        .from("app_pages")
        .update({ is_visible, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["app-pages"] });
      toast.success(data.is_visible ? "Página visível" : "Página oculta");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AppPage> }) => {
      const { data, error } = await supabase
        .from("app_pages")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-pages"] });
      toast.success("Página atualizada!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });
};

export const useReorderPages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pages: { id: string; order_index: number }[]) => {
      const promises = pages.map(({ id, order_index }) =>
        supabase
          .from("app_pages")
          .update({ order_index })
          .eq("id", id)
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-pages"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });
};
