import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface StripeConnectCardProps {
  professionalId: string;
  onStatusChange?: (status: string) => void;
}

const StripeConnectCard = ({ professionalId, onStatusChange }: StripeConnectCardProps) => {
  const [status, setStatus] = useState<string>("loading");
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-connect-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setStatus(data.status || "not_created");
      onStatusChange?.(data.status || "not_created");
    } catch (error) {
      console.error("Error checking connect status:", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Check for URL params after Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeConnect = urlParams.get("stripe_connect");
    
    if (stripeConnect === "success") {
      toast.success("Conta Stripe conectada! Verificando status...");
      checkStatus();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (stripeConnect === "refresh") {
      toast.info("Complete o cadastro da sua conta Stripe");
      handleConnect();
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating connect account:", error);
      toast.error("Erro ao conectar conta Stripe");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "loading":
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />,
          title: "Verificando...",
          description: "Aguarde enquanto verificamos o status da sua conta.",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
        };
      case "active":
        return {
          icon: <CheckCircle className="w-6 h-6 text-therapy" />,
          title: "Conta Conectada",
          description: "Sua conta Stripe está ativa e pronta para receber pagamentos.",
          color: "text-therapy",
          bgColor: "bg-therapy/10",
        };
      case "pending_verification":
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
          title: "Aguardando Verificação",
          description: "Sua conta está sendo analisada pelo Stripe. Isso pode levar alguns dias.",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        };
      case "pending":
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
          title: "Cadastro Incompleto",
          description: "Complete o cadastro da sua conta Stripe para receber pagamentos.",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        };
      default:
        return {
          icon: <CreditCard className="w-6 h-6 text-muted-foreground" />,
          title: "Conta Não Conectada",
          description: "Conecte sua conta Stripe para receber pagamentos das sessões.",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="border-therapy/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-therapy" />
          Recebimentos via Cartão
        </CardTitle>
        <CardDescription>
          Receba pagamentos de sessões via cartão de crédito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex items-start gap-4 p-4 rounded-lg ${statusDisplay.bgColor}`}>
          {statusDisplay.icon}
          <div className="flex-1">
            <p className={`font-medium ${statusDisplay.color}`}>{statusDisplay.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{statusDisplay.description}</p>
          </div>
        </div>

        {status !== "active" && status !== "loading" && (
          <Button 
            onClick={handleConnect} 
            disabled={loading}
            className="w-full mt-4 bg-therapy hover:bg-therapy/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : status === "pending" ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Completar Cadastro
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Conectar Conta Stripe
              </>
            )}
          </Button>
        )}

        {status === "active" && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Os pagamentos serão transferidos automaticamente após a sessão ser realizada.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectCard;
