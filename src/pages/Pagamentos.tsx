import { useIsMobile } from "@/hooks/use-mobile";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MembershipSection from "@/components/pagamentos/MembershipSection";

const Pagamentos = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Fetch user's appointments with payment info
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["user-payments", user?.id],
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
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      case "refund_pending":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100"><Clock className="w-3 h-3 mr-1" /> Reembolso Pendente</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status || "Desconhecido"}</Badge>;
    }
  };

  const PaymentsContent = () => (
    <div className="space-y-6">
      {/* Active Membership */}
      <MembershipSection />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {appointments?.filter(a => a.status === "confirmed" || a.status === "completed")
                    .reduce((sum, a) => sum + (a.professional?.hourly_rate || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">
                  {appointments?.filter(a => a.status === "pending").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-2xl font-bold text-foreground">
                  {appointments?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Sessão com {(appointment.professional as any)?.profiles?.full_name || "Profissional"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {appointment.scheduled_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        R$ {((appointment.professional as any)?.hourly_rate || 0).toFixed(2)}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>
                    {appointment.receipt_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={appointment.receipt_url} target="_blank" rel="noopener noreferrer">
                          Ver Recibo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground">
                Seus pagamentos aparecerão aqui após agendar uma sessão.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container py-4 pt-20">
          <h1 className="text-xl font-bold mb-4">Pagamentos</h1>
          <PaymentsContent />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Pagamentos" subtitle="Gerencie seus pagamentos e histórico de transações">
      <PaymentsContent />
    </UserDesktopLayout>
  );
};

export default Pagamentos;
