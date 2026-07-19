import { useState } from "react";
import { ArrowLeft, Loader2, QrCode, Copy, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoursePixPaymentProps {
  purchaseType: "course" | "membership";
  courseId: string;
  coursePrice: number;
  label: string;
  onBack: () => void;
  onSuccess: () => void;
}

const CoursePixPayment = ({ purchaseType, courseId, coursePrice, label, onBack, onSuccess }: CoursePixPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("process-course-pix", {
        body: { purchaseType, courseId, coursePrice, email },
      });

      if (fnError) {
        console.error("Function invoke error:", fnError);
        throw new Error("Erro ao gerar PIX. Tente novamente.");
      }

      if (!data) {
        throw new Error("Resposta vazia do servidor.");
      }

      // Defensive: check for QR code in multiple possible paths
      const qrCode = data.qr_code || data.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = data.qr_code_base64 || data.point_of_interaction?.transaction_data?.qr_code_base64;

      if (!qrCode) {
        console.error("PIX response missing qr_code:", JSON.stringify(data));
        throw new Error("QR Code não gerado. Verifique os dados e tente novamente.");
      }

      setPixData({
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64 || "",
        payment_id: data.payment_id || data.id || "",
      });
    } catch (err: any) {
      console.error("PIX error:", err);
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  // If PIX generated, show QR code
  if (pixData) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="font-sans font-semibold text-lg text-slate-900 normal-case">{label}</h2>
            <p className="text-sm text-slate-500">R$ {coursePrice.toFixed(2).replace(".", ",")} — PIX</p>
          </div>
        </div>

        <div className="text-center space-y-4">
          {pixData.qr_code_base64 && (
            <div className="bg-white rounded-xl p-4 inline-block mx-auto">
              <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48" />
            </div>
          )}

          <p className="text-slate-600 text-sm">
            Escaneie o QR Code ou copie o código abaixo
          </p>

          <button
            onClick={handleCopyCode}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <><CheckCircle className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
          </button>

          <div className="rounded-lg p-3 bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Após o pagamento, o acesso será liberado automaticamente em até 5 minutos.</p>
            <button onClick={onSuccess} className="text-xs text-emerald-700 hover:underline mt-1">
              Já paguei - verificar acesso
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4" /> Pagamento seguro via Mercado Pago
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors" disabled={isLoading}>
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="font-sans font-semibold text-lg text-slate-900 normal-case">{label}</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" />
            R$ {coursePrice.toFixed(2).replace(".", ",")} — PIX
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleGeneratePix} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-600">E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-slate-50 border-slate-200 text-white placeholder:text-slate-300 focus:border-emerald-500 focus-visible:ring-emerald-500/40" />
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Gerando PIX...</>) : "Gerar QR Code PIX"}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4" /> Pagamento seguro via Mercado Pago
        </div>
      </form>
    </div>
  );
};

export default CoursePixPayment;
