import { Gift, AlertTriangle } from "lucide-react";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionConfig";

const SubscriptionPolicyBanner = () => {
  const { data: settings } = useSubscriptionSettings();
  if (!settings) return null;

  return (
    <>
      {settings.free_period_banner_enabled && (
        <div className="mb-4 rounded-xl border-2 border-therapy bg-therapy/10 p-4 flex items-start gap-3">
          <Gift className="w-5 h-5 text-therapy flex-shrink-0 mt-0.5" />
          <p className="text-sm text-card-foreground font-medium">
            {settings.free_period_banner_text}
          </p>
        </div>
      )}
      {settings.reactivation_warning_enabled && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {settings.reactivation_warning_text}
          </p>
        </div>
      )}
    </>
  );
};

export default SubscriptionPolicyBanner;