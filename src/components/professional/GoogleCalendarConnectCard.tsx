import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  professionalId: string;
}

interface Connection {
  google_email: string;
  last_synced_at: string | null;
  is_active: boolean;
}

const GoogleCalendarConnectCard = ({ professionalId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [working, setWorking] = useState(false);

  const fetchConnection = async () => {
    const { data } = await supabase
      .from("professional_google_calendar")
      .select("google_email, last_synced_at, is_active")
      .eq("professional_id", professionalId)
      .maybeSingle();
    setConnection(data as Connection | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchConnection();

    const handleMessage = (ev: MessageEvent) => {
      if (ev.data?.type === "google-calendar-connected") {
        toast.success("Google Calendar conectado!");
        fetchConnection();
        // trigger first sync
        runSync(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]);

  const handleConnect = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", {
        body: { returnUrl: window.location.href },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("URL não recebida");
      window.open(url, "google-oauth", "width=520,height=640");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao iniciar conexão");
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar o Google Calendar?")) return;
    setWorking(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-disconnect");
      if (error) throw error;
      toast.success("Desconectado");
      setConnection(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao desconectar");
    } finally {
      setWorking(false);
    }
  };

  const runSync = async (showToast = true) => {
    setWorking(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-sync");
      if (error) throw error;
      if (showToast) toast.success("Agenda sincronizada");
      fetchConnection();
    } catch (e) {
      console.error(e);
      if (showToast) toast.error("Erro ao sincronizar");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando integração...</span>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-therapy/15 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-therapy" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-card-foreground">Conectar Google Calendar</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Bloqueie automaticamente horários ocupados na sua agenda do Google e mantenha tudo sincronizado.
            </p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={working}
          className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Conectar Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-card-foreground">Google Calendar conectado</h3>
          <p className="text-sm text-muted-foreground truncate">{connection.google_email}</p>
          {connection.last_synced_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Última sincronização: {new Date(connection.last_synced_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => runSync(true)}
          disabled={working}
          className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-muted/80"
        >
          {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar
        </button>
        <button
          onClick={handleDisconnect}
          disabled={working}
          className="py-2.5 px-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-destructive/20"
        >
          <Unlink className="w-4 h-4" />
          Desconectar
        </button>
      </div>
    </div>
  );
};

export default GoogleCalendarConnectCard;