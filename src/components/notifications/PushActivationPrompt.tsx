import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "fanatica_push_prompt_dismissed_at";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const HIDDEN_PREFIXES = ["/auth", "/admin", "/developer", "/profissional/auth", "/politica", "/termos", "/privacy", "/terms"];

function isStandalone() {
  return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Background alerts only reach devices that opted in; invite installed-app users to do so. */
export function PushActivationPrompt() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    setDismissed(Date.now() - at < SNOOZE_MS);
  }, []);

  if (!user || !isSupported || !isStandalone() || isSubscribed || isLoading || dismissed) return null;
  if (permission === "denied") return null;
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  const close = () => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setDismissed(true); };

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[60] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl">
      <button aria-label="Fechar" onClick={close} className="absolute right-3 top-3 text-muted-foreground"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3 pr-5">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">Ative os alertas no celular</p>
          <p className="text-xs text-muted-foreground">Receba avisos mesmo com o aplicativo fechado.</p>
          <Button size="sm" onClick={async () => { if (await subscribe()) close(); }}>Ativar alertas</Button>
        </div>
      </div>
    </div>
  );
}
