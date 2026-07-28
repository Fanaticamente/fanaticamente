import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface AppModule {
  id: string;
  module_id: string;
  module_type: string;
  name: string;
  description: string | null;
  icon: string;
  is_visible: boolean;
  order_index: number;
  page: string;
  parent_id: string | null;
  config: Json;
  created_at: string;
  updated_at: string;
}

export interface ModuleConfig {
  slides?: Array<{ image: string; title: string; subtitle?: string; cta?: string; ctaLink?: string }>;
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  items?: Array<{ icon: string; label: string; path: string }>;
  logo?: string;
  showMenu?: boolean;
  path?: string;
  backgroundImage?: string;
  cta?: string;
  ctaLink?: string;
}

export const useAppModules = (page?: string) => {
  // IMPORTANT:
  // Realtime invalidation is handled globally in useRealtimeSubscriptions() (App.tsx).
  // Keeping an additional subscription here causes duplicated invalidations and can
  // lead to excessive refetching in the Content Manager.
  return useQuery({
    queryKey: ["app-modules", page],
    queryFn: async () => {
      let query = supabase
        .from("app_modules")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (page) {
        query = query.eq("page", page);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AppModule[];
    },
    // Gerenciador estável: só atualiza após salvar (invalidate) ou refresh manual.
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<AppModule, 'config'>> & { config?: Json } }) => {
      const { data, error } = await supabase
        .from("app_modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Módulo atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar módulo: " + error.message);
    },
  });
};

export const useReorderModules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (modules: { id: string; order_index: number }[]) => {
      const promises = modules.map(({ id, order_index }) =>
        supabase
          .from("app_modules")
          .update({ order_index })
          .eq("id", id)
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });
};

export const useToggleModuleVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { data, error } = await supabase
        .from("app_modules")
        .update({ is_visible })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success(data.is_visible ? "Módulo visível" : "Módulo oculto");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });
};

export const useUpdateModuleConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Json }) => {
      const { data, error } = await supabase
        .from("app_modules")
        .update({ config })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Configuração salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (module: {
      module_id: string;
      module_type: string;
      name: string;
      description?: string | null;
      icon?: string;
      is_visible?: boolean;
      order_index?: number;
      page?: string;
      parent_id?: string | null;
      config?: Json;
    }) => {
      const { data, error } = await supabase
        .from("app_modules")
        .insert(module)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Módulo criado!");
    },
    onError: (error) => {
      toast.error("Erro ao criar: " + error.message);
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("app_modules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Módulo removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
};
