import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that sets up realtime subscriptions.
 *
 * ESCALA (Fase 1): realtime é caro por usuário conectado — cada canal aberto vira
 * uma subscription no servidor e cada evento é entregue a TODOS os clientes.
 * Por isso as assinaturas ficam restritas às rotas administrativas (/admin*),
 * onde a audiência é pequena e a atualização instantânea importa.
 * No app do torcedor o conteúdo do CMS é atualizado por cache/refetch (staleTime),
 * sem manter conexões abertas.
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

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Skip ALL realtime subscriptions outside admin routes (scale) and on manager routes
    if (isManagerRoute || !isAdminRoute) {
      return;
    }

    // Um único canal multiplexado para todas as tabelas observadas no admin
    const channel = supabase
      .channel('admin_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_content' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-content'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_menus' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-menus'] });
          queryClient.invalidateQueries({ queryKey: ['app-menu'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_modules' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-modules'] });
          queryClient.invalidateQueries({ queryKey: ['module-config'] });
          queryClient.invalidateQueries({ queryKey: ['home-modules'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_pages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['app-pages'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          queryClient.invalidateQueries({ queryKey: ['admin-professionals'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professionals' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-professionals'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isManagerRoute, isAdminRoute]);
};
