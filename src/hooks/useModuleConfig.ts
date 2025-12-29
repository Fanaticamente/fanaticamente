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

export const useModuleConfig = (moduleId: string) => {
  return useQuery({
    queryKey: ['module-config', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .eq('module_id', moduleId)
        .single();
      
      if (error) throw error;
      return data as unknown as ModuleConfig;
    },
    staleTime: 0,
  });
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
    staleTime: 0,
  });
};
