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

interface CourseCardPaymentFormProps {
  purchaseType: "course" | "membership";
  courseId: string;
  coursePrice: number;
  label: string;
  onBack: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const CourseCardPaymentForm = ({ purchaseType, courseId, coursePrice, label, onBack, onSuccess }: CourseCardPaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("CPF");
  const [docNumber, setDocNumber] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState(1);

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
      } catch {
        setError("Erro ao carregar SDK de pagamento");
      }
    };
    loadSDK();
  }, []);

  const initializeMercadoPago = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-mercadopago-public-key", {
        body: { context: "courses" },
      });
      if (error || !data?.publicKey) throw new Error("Failed to get public key");
      const mercadoPago = new window.MercadoPago(data.publicKey, { locale: "pt-BR" });
      setMp(mercadoPago);
      setIsSDKLoaded(true);
    } catch {
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

      const tokenData = await mp.createCardToken({
        cardNumber: cleanCardNumber,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: docType,
        identificationNumber: cleanDocNumber,
      });

      if (tokenData.error || !tokenData.id) {
        throw new Error(tokenData.cause?.[0]?.description || "Erro ao tokenizar cartão");
      }

      let paymentMethodId = "visa";
      try {
        const bin = cleanCardNumber.substring(0, 6);
        const pmResult = await mp.getPaymentMethods({ bin });
        if (pmResult.results?.length > 0) paymentMethodId = pmResult.results[0].id;
      } catch {}

      let deviceId: string | undefined;
      try { deviceId = mp.getDeviceId?.() || mp.deviceProfileId; } catch {}

      const { data, error: paymentError } = await supabase.functions.invoke("process-course-payment", {
        body: {
          purchaseType,
          courseId,
          coursePrice,
          token: tokenData.id,
          paymentMethodId,
          installments,
          email,
          deviceId,
        },
      });

      if (paymentError) throw new Error("Erro ao processar pagamento");

      if (data?.status === "approved") {
        toast.success(
          purchaseType === "membership"
            ? "Assinatura ativada! Acesso liberado a todos os cursos."
            : "Pagamento aprovado! Acesso liberado.",
          { duration: 5000 }
        );
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
        setError(`Status: ${data?.status || "desconhecido"}. Tente novamente.`);
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
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => String(currentYear + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" disabled={isLoading}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="font-display text-lg text-white">{label}</h2>
          <p className="text-sm text-white/50 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            R$ {coursePrice.toFixed(2).replace(".", ",")} — Cartão de crédito
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-white/70">Número do cartão</Label>
          <Input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} required className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-white/70">Nome no cartão</Label>
          <Input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="NOME COMO NO CARTÃO" required className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 uppercase" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-white/70">Mês</Label>
            <Select value={expirationMonth} onValueChange={setExpirationMonth} required>
              <SelectTrigger className="bg-white/5 border-white/20 text-white [&>span]:text-white"><SelectValue placeholder="MM" /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-white/70">Ano</Label>
            <Select value={expirationYear} onValueChange={setExpirationYear} required>
              <SelectTrigger className="bg-white/5 border-white/20 text-white [&>span]:text-white"><SelectValue placeholder="AAAA" /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-white/70">CVV</Label>
            <Input value={securityCode} onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" maxLength={4} required className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-white/70">Documento</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white [&>span]:text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm text-white/70">Número</Label>
            <Input value={docNumber} onChange={(e) => setDocNumber(formatDocNumber(e.target.value))} placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} required className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-white/70">E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40" />
        </div>

        <button type="submit" disabled={isLoading || !isSDKLoaded} className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Processando...</>) : (`Pagar R$ ${coursePrice.toFixed(2).replace(".", ",")}`)}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-white/40">
          <Shield className="w-4 h-4" /> Pagamento seguro via Mercado Pago
        </div>
      </form>
    </div>
  );
};

export default CourseCardPaymentForm;
