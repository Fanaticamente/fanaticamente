import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, QrCode } from "lucide-react";

interface PixPaymentCardProps {
  pixKey: string | null;
}

const PixPaymentCard = ({ pixKey }: PixPaymentCardProps) => {
  const hasPixKey = !!pixKey && pixKey.trim().length > 0;

  const getStatusDisplay = () => {
    if (hasPixKey) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-therapy" />,
        title: "PIX Configurado",
        description: `Chave PIX cadastrada: ${pixKey}`,
        color: "text-therapy",
        bgColor: "bg-therapy/10",
      };
    }
    return {
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
      title: "PIX Não Configurado",
      description: "Cadastre sua chave PIX acima para receber pagamentos via PIX.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="border-therapy/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5 text-therapy" />
          Recebimentos via PIX
        </CardTitle>
        <CardDescription>
          Receba pagamentos diretamente na sua conta via PIX
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

        {hasPixKey && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Os clientes poderão pagar via PIX diretamente para você ao agendar sessões.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PixPaymentCard;
