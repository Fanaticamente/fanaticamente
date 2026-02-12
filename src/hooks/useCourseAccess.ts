import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCourseAccess = (courseId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-access", courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return { hasAccess: false, accessType: null };

      // Check individual course purchase
      const { data: courseAccess } = await supabase
        .from("user_course_access")
        .select("id, access_type, expires_at")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (courseAccess) {
        // Check if not expired
        if (!courseAccess.expires_at || new Date(courseAccess.expires_at) > new Date()) {
          return { hasAccess: true, accessType: courseAccess.access_type };
        }
      }

      // Check active membership
      const { data: membership } = await supabase
        .from("user_memberships")
        .select("id, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (membership) {
        return { hasAccess: true, accessType: "membership" };
      }

      return { hasAccess: false, accessType: null };
    },
    enabled: !!user && !!courseId,
  });
};
