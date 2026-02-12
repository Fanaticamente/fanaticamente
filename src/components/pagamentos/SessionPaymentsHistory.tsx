import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SessionPaymentsHistory = () => {
  const { user } = useAuth();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["user-session-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          professional:professionals(
            hourly_rate,
            profiles:profiles(full_name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      case "cancelled":
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" /> Cancelado
          </Badge>
        );
      case "refund_pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/20 border-orange-500/30">
            <Clock className="w-3 h-3 mr-1" /> Reembolso
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 border-blue-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Reembolsado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/10 text-white/60 hover:bg-white/10">
            {status || "—"}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Receipt className="w-7 h-7 text-white/30" />
        </div>
        <h3 className="text-base font-semibold text-white/80 mb-1">Nenhuma sessão encontrada</h3>
        <p className="text-sm text-white/40 max-w-xs mx-auto">
          Seus pagamentos de sessões aparecerão aqui após agendar com um profissional.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => {
        const professionalName = (appointment.professional as any)?.profiles?.full_name || "Profissional";
        const rate = (appointment.professional as any)?.hourly_rate || 0;

        return (
          <div
            key={appointment.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-lg bg-white/10 shrink-0">
                <Calendar className="w-4 h-4 text-white/60" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Sessão com {professionalName}
                </p>
                <p className="text-xs text-white/40">
                  {format(new Date(appointment.scheduled_date), "dd 'de' MMM, yyyy", { locale: ptBR })} às {appointment.scheduled_time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {rate.toFixed(2)}
                </p>
                {getStatusBadge(appointment.status)}
              </div>
              {appointment.receipt_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8"
                  asChild
                >
                  <a href={appointment.receipt_url} target="_blank" rel="noopener noreferrer" title="Ver comprovante">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionPaymentsHistory;
