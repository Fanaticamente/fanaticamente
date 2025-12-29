import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that sets up realtime subscriptions for app content and menus.
 * Should be called once at the app level to ensure realtime updates work everywhere.
 */
export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to app_content changes
    const contentChannel = supabase
      .channel('global_app_content_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_content' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-content'] });
        }
      )
      .subscribe();

    // Subscribe to app_menus changes
    const menusChannel = supabase
      .channel('global_app_menus_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_menus' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-menus'] });
          queryClient.invalidateQueries({ queryKey: ['app-menu'] });
        }
      )
      .subscribe();

    // Subscribe to app_modules changes
    const modulesChannel = supabase
      .channel('global_app_modules_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_modules' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-modules'] });
          queryClient.invalidateQueries({ queryKey: ['module-config'] });
          queryClient.invalidateQueries({ queryKey: ['home-modules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(menusChannel);
      supabase.removeChannel(modulesChannel);
    };
  }, [queryClient]);
};