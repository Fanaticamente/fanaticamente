import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, QrCode, Edit2, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PixPaymentCardProps {
  professionalId: string;
  pixKey: string | null;
  onUpdate?: () => void;
}

const PixPaymentCard = ({ professionalId, pixKey, onUpdate }: PixPaymentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPixKey, setNewPixKey] = useState(pixKey || "");
  const [isSaving, setIsSaving] = useState(false);

  const hasPixKey = !!pixKey && pixKey.trim().length > 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          pix_key: newPixKey.trim() || null,
          pix_key_type: null
        })
        .eq('id', professionalId);

      if (error) throw error;

      toast.success("Chave PIX atualizada com sucesso!");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error saving PIX key:", error);
      toast.error("Erro ao salvar chave PIX");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewPixKey(pixKey || "");
    setIsEditing(false);
  };

  const getStatusDisplay = () => {
    if (hasPixKey) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-therapy" />,
        title: "PIX Configurado",
        description: pixKey,
        color: "text-therapy",
        bgColor: "bg-therapy/10",
      };
    }
    return {
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
      title: "PIX Não Configurado",
      description: "Cadastre sua chave PIX para receber pagamentos via PIX.",
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
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-card-foreground text-sm font-medium mb-2">
                Chave PIX
              </label>
              <p className="text-muted-foreground text-xs mb-3">
                Informe sua chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)
              </p>
              <input
                type="text"
                value={newPixKey}
                onChange={(e) => setNewPixKey(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-therapy hover:bg-therapy/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex items-start gap-4 p-4 rounded-lg ${statusDisplay.bgColor}`}>
              {statusDisplay.icon}
              <div className="flex-1">
                <p className={`font-medium ${statusDisplay.color}`}>{statusDisplay.title}</p>
                <p className="text-sm text-muted-foreground mt-1 break-all">{statusDisplay.description}</p>
              </div>
            </div>

            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full mt-4"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {hasPixKey ? "Alterar Chave PIX" : "Cadastrar Chave PIX"}
            </Button>

            {hasPixKey && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Os clientes poderão pagar via PIX diretamente para você ao agendar sessões.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PixPaymentCard;
