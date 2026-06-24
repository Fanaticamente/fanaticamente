import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import logoIcon from "@/assets/fanatica-logo-icon.png";

const VerificarRecibo = () => {
  const { numero } = useParams<{ numero: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const verify = async () => {
      if (!numero) {
        setStatus("invalid");
        return;
      }

      const receiptNumber = parseInt(numero, 10);
      if (isNaN(receiptNumber)) {
        setStatus("invalid");
        return;
      }

      const { data, error } = await supabase.rpc("verify_receipt_by_number", {
        p_receipt_number: receiptNumber,
      });

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setStatus("invalid");
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      setReceiptData(row);
      setStatus("valid");
    };

    verify();
  }, [numero]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
        <img src={logoIcon} alt="Fanaticamente" className="w-16 h-16 mx-auto" />

        {status === "loading" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse mx-auto" />
            <p className="text-gray-500">Verificando documento...</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Documento Autêntico</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Este recibo de atendimento foi emitido pelo sistema de agendamentos do{" "}
              <strong>Fanaticamente App</strong> e é autêntico.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1 text-sm text-gray-700">
              <p><strong>Recibo Nº:</strong> {receiptData?.receipt_number}</p>
              {receiptData?.receipt_data && (
                <>
                  <p><strong>Profissional:</strong> {(receiptData.receipt_data as any)?.professional?.full_name}</p>
                  <p><strong>CRP:</strong> {(receiptData.receipt_data as any)?.professional?.crp}</p>
                  <p><strong>Serviço:</strong> {(receiptData.receipt_data as any)?.service?.description}</p>
                </>
              )}
              <p><strong>Emitido em:</strong> {receiptData?.created_at ? new Date(receiptData.created_at).toLocaleDateString("pt-BR") : "—"}</p>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Documento Não Encontrado</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Não foi possível localizar um recibo com este número no sistema do Fanaticamente App.
              Verifique se o QR Code foi lido corretamente.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Fanaticamente App — Sistema de Agendamentos
        </p>
      </div>
    </div>
  );
};

export default VerificarRecibo;
