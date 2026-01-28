import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CompletedAppointment {
  id: string;
  professional_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  consultation_link: string | null;
  rating?: number | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useGlobalSessionCompletion = () => {
  const { user, roles, loading } = useAuth();
  const [completedAppointment, setCompletedAppointment] = useState<CompletedAppointment | null>(null);

  useEffect(() => {
    // Only listen for regular users, not professionals viewing their own dashboard
    const isProfessional = roles?.includes("professional");
    if (loading || !user || isProfessional) return;

    console.log("[GlobalSessionCompletion] Setting up realtime listener for user:", user.id);

    const channel = supabase
      .channel(`global-session-completion-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('[GlobalSessionCompletion] Appointment update received:', payload);
          const updated = payload.new as any;
          const previousStatus = (payload.old as any)?.status;

          // Only trigger when professional marks session as completed
          if (updated.status === 'completed' && previousStatus !== 'completed') {
            console.log('[GlobalSessionCompletion] Session completed, fetching full appointment data');
            
            // Fetch full appointment data with professional info
            const { data: appointmentData, error } = await supabase
              .from('appointments')
              .select(`
                id,
                professional_id,
                scheduled_date,
                scheduled_time,
                status,
                notes,
                consultation_link,
                rating,
                professionals!inner(
                  user_id,
                  crp,
                  degree,
                  hourly_rate
                )
              `)
              .eq('id', updated.id)
              .single();

            if (error) {
              console.error('[GlobalSessionCompletion] Error fetching appointment:', error);
              return;
            }

            // Only show dialog if not already rated
            if (appointmentData && !appointmentData.rating) {
              // Fetch professional's profile
              const professionalUserId = (appointmentData.professionals as any)?.user_id;
              
              if (professionalUserId) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('user_id', professionalUserId)
                  .single();

                const fullAppointment: CompletedAppointment = {
                  id: appointmentData.id,
                  professional_id: appointmentData.professional_id,
                  scheduled_date: appointmentData.scheduled_date,
                  scheduled_time: appointmentData.scheduled_time,
                  status: appointmentData.status,
                  notes: appointmentData.notes,
                  consultation_link: appointmentData.consultation_link,
                  rating: appointmentData.rating,
                  profile: profileData
                };

                console.log('[GlobalSessionCompletion] Opening completion dialog for:', fullAppointment);
                setCompletedAppointment(fullAppointment);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[GlobalSessionCompletion] Cleaning up realtime listener");
      supabase.removeChannel(channel);
    };
  }, [user?.id, loading, roles]);

  const clearCompletedAppointment = () => {
    setCompletedAppointment(null);
  };

  return {
    completedAppointment,
    setCompletedAppointment,
    clearCompletedAppointment
  };
};
