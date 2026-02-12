import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Crown, Calendar, CreditCard, QrCode, XCircle, Loader2 } from "lucide-react";
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

  const currentMembership = activeMembership || cancelledButActive;

  const handleCancelClick = (membershipId: string) => {
    setCancellingId(membershipId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-course-membership", {
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
      <Card>
        <CardContent className="pt-6">
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!currentMembership) return null;

  const isCardPayment = currentMembership.payment_method === "mercadopago_card";
  const isPixPayment = currentMembership.payment_method === "mercadopago_pix";
  const expiresAt = new Date(currentMembership.expires_at);
  const daysLeft = differenceInDays(expiresAt, new Date());
  const isCancelled = currentMembership.status === "cancelled";

  return (
    <>
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-500">
            <Crown className="w-5 h-5" />
            Assinatura FanatiClass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                {isCardPayment ? (
                  <CreditCard className="w-5 h-5 text-amber-500" />
                ) : (
                  <QrCode className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Assinatura Mensal — R$ 49,90
                </p>
                <p className="text-sm text-muted-foreground">
                  {isCardPayment ? "Cartão de crédito (recorrente)" : "PIX (pagamento único)"}
                </p>
              </div>
            </div>
            {isCancelled ? (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                Cancelada
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Ativa
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {isCancelled
                ? `Acesso até ${format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} (${daysLeft} dias restantes)`
                : isPixPayment
                ? `Válido até ${format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} (${daysLeft} dias restantes)`
                : `Próxima cobrança: ${format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
            </span>
          </div>

          {isPixPayment && !isCancelled && daysLeft <= 5 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-600">
              ⚠️ Sua assinatura PIX expira em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}. Renove para manter o acesso.
            </div>
          )}

          {isCardPayment && !isCancelled && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => handleCancelClick(currentMembership.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar assinatura
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao cancelar, você manterá o acesso aos cursos até{" "}
              <strong>{format(expiresAt, "dd/MM/yyyy")}</strong>. Após essa data, será
              necessário realizar uma nova assinatura para continuar acessando os conteúdos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export default MembershipSection;
