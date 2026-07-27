import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface AppContent {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image' | 'json';
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

interface AppMenu {
  id: string;
  menu_id: string;
  items: MenuItem[];
  created_at: string;
  updated_at: string;
}

export const useAppContent = (category?: string) => {
  return useQuery({
    queryKey: ['app-content', category],
    queryFn: async () => {
      let query = supabase.from('app_content').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('key');
      
      if (error) throw error;
      return data as AppContent[];
    },
    // Escala: sem realtime global; conteúdo do CMS revalida a cada 60s
    staleTime: 60_000,
  });
};

export const useAppContentByKey = (key: string) => {
  return useQuery({
    queryKey: ['app-content', 'key', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_content')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data as AppContent;
    },
  });
};

export const useContentValue = (key: string, fallback: string = '') => {
  const { data } = useQuery({
    queryKey: ['app-content', 'value', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_content')
        .select('value')
        .eq('key', key)
        .single();
      
      if (error) return fallback;
      return data?.value || fallback;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
  
  return data || fallback;
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from('app_content')
        .update({ value })
        .eq('key', key)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-content'] });
    },
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: Omit<AppContent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('app_content')
        .insert(content)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-content'] });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('app_content')
        .delete()
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-content'] });
    },
  });
};

// Menu hooks
export const useAppMenus = () => {
  return useQuery({
    queryKey: ['app-menus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_menus')
        .select('*');
      
      if (error) throw error;
      return data?.map(menu => ({
        ...menu,
        items: menu.items as unknown as MenuItem[]
      })) as AppMenu[];
    },
    staleTime: 60_000,
  });
};

export const useAppMenu = (menuId: string) => {
  return useQuery({
    queryKey: ['app-menu', menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_menus')
        .select('*')
        .eq('menu_id', menuId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        items: data.items as unknown as MenuItem[]
      } as AppMenu;
    },
    staleTime: 60_000,
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ menuId, items }: { menuId: string; items: MenuItem[] }) => {
      const { data, error } = await supabase
        .from('app_menus')
        .update({ items: items as unknown as Json })
        .eq('menu_id', menuId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-menus'] });
      queryClient.invalidateQueries({ queryKey: ['app-menu'] });
    },
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ menuId, items }: { menuId: string; items: MenuItem[] }) => {
      const { data, error } = await supabase
        .from('app_menus')
        .insert([{ menu_id: menuId, items: items as unknown as Json }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-menus'] });
    },
  });
};
