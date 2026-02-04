import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that sets up realtime subscriptions for app content and menus.
 * Should be called once at the app level to ensure realtime updates work everywhere.
 * 
 * IMPORTANT: Disabled on Content Manager routes (/developer*, /desenvolvedor*)
 * to prevent auto-refresh loops in the preview iframes.
 */
export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Content managers must be 100% stable - no realtime invalidations
  // Use reactive location.pathname instead of window.location
  const isManagerRoute = 
    location.pathname.startsWith("/developer") || 
    location.pathname.startsWith("/desenvolvedor");

  useEffect(() => {
    // Skip ALL realtime subscriptions on manager routes
    if (isManagerRoute) {
      return;
    }

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

    // Subscribe to profiles changes (for admin tables)
    const profilesChannel = supabase
      .channel('global_profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          queryClient.invalidateQueries({ queryKey: ['admin-professionals'] });
        }
      )
      .subscribe();

    // Subscribe to professionals changes
    const professionalsChannel = supabase
      .channel('global_professionals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professionals' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-professionals'] });
        }
      )
      .subscribe();

    // Subscribe to appointments changes
    const appointmentsChannel = supabase
      .channel('global_appointments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
        }
      )
      .subscribe();

    // Subscribe to app_pages changes
    const pagesChannel = supabase
      .channel('global_app_pages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_pages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-pages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(menusChannel);
      supabase.removeChannel(modulesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(professionalsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(pagesChannel);
    };
  }, [queryClient, isManagerRoute]);
};
