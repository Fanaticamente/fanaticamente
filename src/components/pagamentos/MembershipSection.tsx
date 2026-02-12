import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Calendar, CreditCard, QrCode, XCircle, Loader2, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const MembershipSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["user-memberships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const activeMembership = memberships?.find(
    (m) => m.status === "active" && new Date(m.expires_at) > new Date()
  );

  const cancelledButActive = memberships?.find(
    (m) => m.status === "cancelled" && new Date(m.expires_at) > new Date()
  );

  const expiredMemberships = memberships?.filter(
    (m) => new Date(m.expires_at) <= new Date() || (m.status === "cancelled" && new Date(m.expires_at) <= new Date())
  ) || [];

  const currentMembership = activeMembership || cancelledButActive;

  const handleCancelClick = (membershipId: string) => {
    setCancellingId(membershipId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-course-membership", {
        body: { membershipId: cancellingId },
      });
      if (error) throw error;
      toast.success("Assinatura cancelada. Acesso mantido até o fim do período.");
      queryClient.invalidateQueries({ queryKey: ["user-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["course-access"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar assinatura");
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted/50 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const getMembershipExpiresAt = (m: any) => new Date(m.expires_at);
  const getMembershipDaysLeft = (m: any) => differenceInDays(getMembershipExpiresAt(m), new Date());

  return (
    <>
      {/* Active Subscription */}
      {currentMembership ? (
        <ActiveMembershipCard
          membership={currentMembership}
          onCancel={handleCancelClick}
        />
      ) : (
        <NoActiveSubscription />
      )}

      {/* Past Subscriptions */}
      {expiredMemberships.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Histórico
          </h3>
          <div className="space-y-3">
            {expiredMemberships.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {m.payment_method === "mercadopago_card" ? (
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Assinatura Mensal — R$ 49,90
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Expirou em {format(getMembershipExpiresAt(m), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Expirada
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Ao cancelar, você manterá o acesso aos cursos até{" "}
              <strong>
                {currentMembership && format(new Date(currentMembership.expires_at), "dd/MM/yyyy")}
              </strong>
              . Após essa data, será necessário realizar uma nova assinatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isCancelling} className="rounded-xl">
              Manter assinatura
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isCancelling ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Cancelando...</>
              ) : (
                "Confirmar cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Sub-components ---

const ActiveMembershipCard = ({
  membership,
  onCancel,
}: {
  membership: any;
  onCancel: (id: string) => void;
}) => {
  const isCardPayment = membership.payment_method === "mercadopago_card";
  const isPixPayment = membership.payment_method === "mercadopago_pix";
  const expiresAt = new Date(membership.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const isCancelled = membership.status === "cancelled";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-amber-600/5">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-xl uppercase tracking-wide text-foreground">
                FanatiClass
              </h3>
              <p className="text-sm text-muted-foreground">Assinatura Mensal</p>
            </div>
          </div>
          {isCancelled ? (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              Cancelada
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Ativa
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">R$ 49,90</span>
          <span className="text-muted-foreground text-sm">/mês</span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            {isCardPayment ? (
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            ) : (
              <QrCode className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Método</p>
              <p className="text-sm font-medium text-foreground">
                {isCardPayment ? "Cartão de crédito" : "PIX"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                {isCancelled
                  ? "Acesso até"
                  : isPixPayment
                  ? "Válido até"
                  : "Próxima cobrança"}
              </p>
              <p className="text-sm font-medium text-foreground">
                {format(expiresAt, "dd 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* PIX expiry warning */}
        {isPixPayment && !isCancelled && daysLeft <= 5 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700">
              Sua assinatura PIX expira em <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong>. Renove para manter o acesso.
            </p>
          </div>
        )}

        {/* Cancelled info */}
        {isCancelled && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <Clock className="w-5 h-5 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-700">
              Assinatura cancelada. Acesso mantido por mais <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong>.
            </p>
          </div>
        )}

        {/* Cancel button */}
        {isCardPayment && !isCancelled && (
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onCancel(membership.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar assinatura
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const NoActiveSubscription = () => (
  <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
    <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
      <Crown className="w-7 h-7 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma assinatura ativa</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      Assine o FanatiClass para ter acesso ilimitado a todos os cursos e conteúdos exclusivos da plataforma.
    </p>
  </div>
);

export default MembershipSection;
