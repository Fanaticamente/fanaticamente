import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, CreditCard, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MercadoPagoCardFormProps {
  planId: string;
  planName: string;
  planPrice: number;
  onBack: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const MercadoPagoCardForm = ({ planId, planName, planPrice, onBack, onSuccess }: MercadoPagoCardFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [cardForm, setCardForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email, setEmail] = useState("");

  // Load MercadoPago SDK
  useEffect(() => {
    const loadSDK = async () => {
      try {
        // Check if SDK is already loaded
        if (window.MercadoPago) {
          await initializeMercadoPago();
          return;
        }

        // Load SDK script
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => initializeMercadoPago();
        script.onerror = () => setError("Erro ao carregar SDK do Mercado Pago");
        document.body.appendChild(script);
      } catch (err) {
        console.error("Error loading SDK:", err);
        setError("Erro ao carregar SDK do Mercado Pago");
      }
    };

    loadSDK();
  }, []);

  const initializeMercadoPago = async () => {
    try {
      // Get public key from edge function
      const { data, error } = await supabase.functions.invoke("get-mercadopago-public-key");

      if (error || !data?.publicKey) {
        throw new Error("Failed to get public key");
      }

      const mercadoPago = new window.MercadoPago(data.publicKey, {
        locale: "pt-BR",
      });

      setMp(mercadoPago);
      setIsSDKLoaded(true);
    } catch (err) {
      console.error("Error initializing MercadoPago:", err);
      setError("Erro ao inicializar Mercado Pago");
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.slice(0, 19);
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!mp) {
        throw new Error("SDK não inicializado");
      }

      // Create card token
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardholderName: cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode: securityCode,
        identificationType: identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, ""),
      };

      const tokenResponse = await mp.createCardToken(cardData);

      if (tokenResponse.error) {
        throw new Error(tokenResponse.error);
      }

      // Get payment method ID based on card number
      const bin = cardNumber.replace(/\s/g, "").slice(0, 6);
      const paymentMethodsResponse = await mp.getPaymentMethods({ bin });
      
      if (!paymentMethodsResponse.results || paymentMethodsResponse.results.length === 0) {
        throw new Error("Método de pagamento não identificado");
      }

      const paymentMethodId = paymentMethodsResponse.results[0].id;

      // Get device ID for anti-fraud (if available from SDK)
      let deviceId = null;
      try {
        if (mp.getDeviceId) {
          deviceId = await mp.getDeviceId();
        }
      } catch (deviceErr) {
        console.log("Could not get device ID:", deviceErr);
      }

      // Process payment with enhanced anti-fraud data
      const { data, error: paymentError } = await supabase.functions.invoke("process-mercadopago-payment", {
        body: {
          planId,
          token: tokenResponse.id,
          paymentMethodId,
          email,
          identificationType,
          identificationNumber: identificationNumber.replace(/\D/g, ""),
          installments: 1,
          deviceId, // For anti-fraud
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message || "Erro ao processar pagamento");
      }

      if (data?.success) {
        toast.success("Pagamento aprovado! Seu perfil está em análise.");
        onSuccess();
      } else if (data?.status === "in_process") {
        toast.info("Pagamento em processamento. Aguarde a confirmação.");
        onSuccess();
      } else if (data?.status === "rejected") {
        const rejectionMessages: Record<string, string> = {
          cc_rejected_bad_filled_card_number: "Número do cartão inválido",
          cc_rejected_bad_filled_date: "Data de validade inválida",
          cc_rejected_bad_filled_other: "Dados do cartão inválidos",
          cc_rejected_bad_filled_security_code: "Código de segurança inválido",
          cc_rejected_blacklist: "Cartão não permitido",
          cc_rejected_call_for_authorize: "Autorização negada pela operadora",
          cc_rejected_card_disabled: "Cartão desabilitado",
          cc_rejected_card_error: "Erro no cartão",
          cc_rejected_duplicated_payment: "Pagamento duplicado",
          cc_rejected_high_risk: "Pagamento recusado por segurança",
          cc_rejected_insufficient_amount: "Saldo insuficiente",
          cc_rejected_invalid_installments: "Parcelas inválidas",
          cc_rejected_max_attempts: "Limite de tentativas excedido",
        };
        const message = rejectionMessages[data.status_detail] || "Pagamento recusado. Tente outro cartão.";
        throw new Error(message);
      } else {
        throw new Error(data?.error || "Erro desconhecido no pagamento");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Erro ao processar pagamento");
      toast.error(err.message || "Erro ao processar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));

  if (!isSDKLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-therapy mb-4" />
        <p className="text-muted-foreground">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-display text-xl text-card-foreground">
            Pagamento - {planName}
          </h2>
          <p className="text-sm text-muted-foreground">
            R$ {planPrice.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número do Cartão</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="cardNumber"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="pl-10"
              required
              maxLength={19}
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="space-y-2">
          <Label htmlFor="cardholderName">Nome no Cartão</Label>
          <Input
            id="cardholderName"
            type="text"
            placeholder="NOME COMO ESTÁ NO CARTÃO"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            required
          />
        </div>

        {/* Expiration and CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={expirationMonth} onValueChange={setExpirationMonth} required>
              <SelectTrigger>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={expirationYear} onValueChange={setExpirationYear} required>
              <SelectTrigger>
                <SelectValue placeholder="AAAA" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityCode">CVV</Label>
            <Input
              id="securityCode"
              type="text"
              placeholder="123"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
              maxLength={4}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Document */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Documento</Label>
            <Select value={identificationType} onValueChange={setIdentificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="identificationNumber">Número</Label>
            <Input
              id="identificationNumber"
              type="text"
              placeholder={identificationType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-therapy text-therapy-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Pagar R$ {planPrice.toFixed(2).replace(".", ",")}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          Pagamento seguro processado pelo Mercado Pago
        </div>
      </form>
    </div>
  );
};

export default MercadoPagoCardForm;
