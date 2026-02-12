import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserCourseAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-course-access-all", user?.id],
    queryFn: async (): Promise<{ accessibleIds: Set<string>; hasMembership: boolean }> => {
      if (!user) return { accessibleIds: new Set<string>(), hasMembership: false };

      // Get individual course purchases
      const { data: courseAccess } = await supabase
        .from("user_course_access")
        .select("course_id, expires_at")
        .eq("user_id", user.id);

      const accessibleIds = new Set<string>();
      const now = new Date();

      courseAccess?.forEach((ca) => {
        if (!ca.expires_at || new Date(ca.expires_at) > now) {
          accessibleIds.add(ca.course_id);
        }
      });

      // Check active membership (grants access to all)
      const { data: membership } = await supabase
        .from("user_memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", now.toISOString())
        .limit(1)
        .maybeSingle();

      return { accessibleIds, hasMembership: !!membership };
    },
    enabled: !!user,
  });
};
