import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAppLogo = () => {
  return useQuery({
    queryKey: ["app-logo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("*")
        .eq("key", "logo_principal")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching logo:", error);
      }

      return data?.value || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAppLogoSmall = () => {
  return useQuery({
    queryKey: ["app-logo-small"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("*")
        .eq("key", "logo_pequeno")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching small logo:", error);
      }

      return data?.value || null;
    },
    staleTime: 1000 * 60 * 5,
  });
};
