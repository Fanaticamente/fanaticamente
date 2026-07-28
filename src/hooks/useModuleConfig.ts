import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ModuleConfig {
  id: string;
  module_id: string;
  module_type: string;
  name: string;
  is_visible: boolean;
  config: Record<string, unknown>;
}

type CachedModuleConfig = {
  updatedAt: number;
  data: ModuleConfig;
};

const STORAGE_PREFIX = "lovable:module-config:";

const readCached = (moduleId: string): CachedModuleConfig | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${moduleId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedModuleConfig;
    if (!parsed?.data || typeof parsed.updatedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCached = (moduleId: string, data: ModuleConfig) => {
  try {
    const payload: CachedModuleConfig = { updatedAt: Date.now(), data };
    localStorage.setItem(`${STORAGE_PREFIX}${moduleId}`, JSON.stringify(payload));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
};

export const useModuleConfig = (moduleId: string) => {
  const cached = typeof window !== "undefined" ? readCached(moduleId) : null;

  const query = useQuery({
    queryKey: ["module-config", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_modules")
        .select("*")
        .eq("module_id", moduleId)
        .single();

      if (error) throw error;
      return data as unknown as ModuleConfig;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    gcTime: 24 * 60 * 60 * 1000,
    // Estabilidade no gerenciador: sem refetch automático ao voltar para a tela.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (query.data) writeCached(moduleId, query.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, query.data]);

  return query;
};

export const useAllHomeModules = () => {
  return useQuery({
    queryKey: ['home-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .eq('page', 'home')
        .eq('is_visible', true)
        .order('order_index');
      
      if (error) throw error;
      return data as unknown as ModuleConfig[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useDesktopModuleConfig = (moduleId: string) => {
  return useQuery({
    queryKey: ["desktop-module-config", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_modules")
        .select("*")
        .eq("module_id", moduleId)
        .eq("page", "desktop")
        .single();

      if (error) throw error;
      return data as unknown as ModuleConfig;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
