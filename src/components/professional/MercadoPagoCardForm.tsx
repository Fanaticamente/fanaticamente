import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const [error, setError] = useState<string | null>(null);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ discount: number; finalPrice: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Card form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("CPF");
  const [docNumber, setDocNumber] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState(1);

  // Load MercadoPago SDK
  useEffect(() => {
    const loadSDK = async () => {
      try {
        if (window.MercadoPago) {
          await initializeMercadoPago();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => initializeMercadoPago();
        script.onerror = () => setError("Erro ao carregar SDK de pagamento");
        document.body.appendChild(script);
      } catch (err) {
        console.error("Error loading SDK:", err);
        setError("Erro ao carregar SDK de pagamento");
      }
    };

    loadSDK();
  }, []);

  const initializeMercadoPago = async () => {
    try {
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
      setError("Erro ao inicializar sistema de pagamento");
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatDocNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (docType === "CPF") {
      return digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return digits.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mp || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const cleanCardNumber = cardNumber.replace(/\s/g, "");
      const cleanDocNumber = docNumber.replace(/\D/g, "");

      // Create card token using SDK
      const tokenData = await mp.createCardToken({
        cardNumber: cleanCardNumber,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode: securityCode,
        identificationType: docType,
        identificationNumber: cleanDocNumber,
      });

      if (tokenData.error || !tokenData.id) {
        throw new Error(tokenData.cause?.[0]?.description || "Erro ao tokenizar cartão");
      }

      // Detect payment method from card number
      let paymentMethodId = "visa";
      try {
        const bin = cleanCardNumber.substring(0, 6);
        const pmResult = await mp.getPaymentMethods({ bin });
        if (pmResult.results?.length > 0) {
          paymentMethodId = pmResult.results[0].id;
        }
      } catch (pmErr) {
        console.warn("Could not detect payment method, using default:", pmErr);
      }

      // Get device ID for anti-fraud
      let deviceId: string | undefined;
      try {
        deviceId = mp.getDeviceId?.() || mp.deviceProfileId;
      } catch {}

      // Process payment via edge function
      const { data, error: paymentError } = await supabase.functions.invoke("process-mercadopago-payment", {
        body: {
          planId,
          token: tokenData.id,
          paymentMethodId,
          installments,
          email,
          deviceId,
          couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        },
      });

      if (paymentError) {
        throw new Error("Erro ao processar pagamento");
      }

      if (data?.status === "approved") {
        toast.success("Pagamento aprovado! Sua assinatura foi ativada.", { duration: 5000 });
        onSuccess();
      } else if (data?.status === "rejected") {
        const detail = data.status_detail || "";
        let msg = "Pagamento recusado.";
        if (detail.includes("insufficient")) msg = "Saldo insuficiente no cartão.";
        else if (detail.includes("invalid_security_code")) msg = "Código de segurança inválido.";
        else if (detail.includes("date_expired")) msg = "Cartão expirado.";
        else if (detail.includes("call_for_authorize")) msg = "Autorize a transação junto ao seu banco.";
        setError(msg);
      } else {
        setError(`Status do pagamento: ${data?.status || "desconhecido"}. Tente novamente.`);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSDKLoaded && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-therapy" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => String(currentYear + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-display text-lg text-card-foreground">
            {planName} — R$ {planPrice.toFixed(2).replace(".", ",")}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            Cartão de crédito
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Coupon Field */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              if (couponApplied) {
                setCouponApplied(null);
                setCouponError(null);
              }
            }}
            placeholder="Cupom"
            disabled={!!couponApplied || couponLoading}
            className="bg-background border-border uppercase flex-1"
          />
          {couponApplied ? (
            <button
              type="button"
              onClick={() => {
                setCouponApplied(null);
                setCouponCode("");
                setCouponError(null);
              }}
              className="px-3 py-2 text-xs font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors whitespace-nowrap"
            >
              Remover
            </button>
          ) : (
            <button
              type="button"
              disabled={!couponCode.trim() || couponLoading}
              onClick={async () => {
                setCouponLoading(true);
                setCouponError(null);
                try {
                  const code = couponCode.trim();
                  const { data, error: fetchError } = await supabase
                    .from("coupons")
                    .select("*")
                    .eq("code", code)
                    .eq("is_active", true)
                    .maybeSingle();

                  if (fetchError) throw fetchError;
                  if (!data) { setCouponError("Cupom inválido"); return; }
                  if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError("Cupom expirado"); return; }
                  if (data.max_uses && data.current_uses >= data.max_uses) { setCouponError("Cupom esgotado"); return; }
                  if (data.applicable_to !== "all" && data.applicable_to !== "subscription") { setCouponError("Cupom não aplicável"); return; }
                  if (data.min_amount && planPrice < Number(data.min_amount)) { setCouponError(`Valor mínimo: R$ ${Number(data.min_amount).toFixed(2).replace(".", ",")}`); return; }

                  let discount = 0;
                  if (data.discount_type === "percentage") {
                    discount = planPrice * (Number(data.discount_value) / 100);
                  } else {
                    discount = Math.min(Number(data.discount_value), planPrice);
                  }
                  const finalPrice = Math.max(planPrice - discount, 0);
                  setCouponApplied({ discount, finalPrice });
                  toast.success(`Cupom aplicado! Desconto de R$ ${discount.toFixed(2).replace(".", ",")}`);
                } catch {
                  setCouponError("Erro ao validar cupom");
                } finally {
                  setCouponLoading(false);
                }
              }}
              className="px-3 py-2 text-xs font-medium bg-therapy text-therapy-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {couponLoading ? "..." : "Aplicar"}
            </button>
          )}
        </div>
        {couponError && <p className="text-xs text-destructive">{couponError}</p>}
        {couponApplied && (
          <p className="text-xs text-green-500">
            Desconto aplicado: -R$ {couponApplied.discount.toFixed(2).replace(".", ",")} → Total: R$ {couponApplied.finalPrice.toFixed(2).replace(".", ",")}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card number */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Número do cartão</Label>
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            required
            className="bg-background border-border"
          />
        </div>

        {/* Cardholder name */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Nome no cartão</Label>
          <Input
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="NOME COMO NO CARTÃO"
            required
            className="bg-background border-border uppercase"
          />
        </div>

        {/* Expiration + CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Mês</Label>
            <Select value={expirationMonth} onValueChange={setExpirationMonth} required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Ano</Label>
            <Select value={expirationYear} onValueChange={setExpirationYear} required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="AAAA" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">CVV</Label>
            <Input
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              maxLength={4}
              required
              className="bg-background border-border"
            />
          </div>
        </div>

        {/* Document */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Documento</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm text-muted-foreground">Número</Label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(formatDocNumber(e.target.value))}
              placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
              required
              className="bg-background border-border"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">E-mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="bg-background border-border"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !isSDKLoaded}
          className="w-full py-4 bg-therapy text-therapy-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            `Pagar R$ ${(couponApplied?.finalPrice ?? planPrice).toFixed(2).replace(".", ",")}`
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
