import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  period: string;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  order_index: number;
}

export interface SubscriptionSettings {
  id: string;
  subscriptions_enabled: boolean;
  free_period_banner_enabled: boolean;
  free_period_banner_text: string;
  reactivation_warning_enabled: boolean;
  reactivation_warning_text: string;
  onboarding_subscription_text: string;
  onboarding_subscription_subtitle: string;
}

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })) as SubscriptionPlan[];
    },
    staleTime: 30_000,
    refetchOnMount: "always",
  });
};

export const useSubscriptionSettings = () => {
  return useQuery({
    queryKey: ["subscription-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as SubscriptionSettings | null;
    },
    staleTime: 30_000,
    refetchOnMount: "always",
  });
};