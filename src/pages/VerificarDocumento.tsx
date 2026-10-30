import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldOff, Search } from "lucide-react";
import logoIcon from "@/assets/fanatica-logo-icon.png";

type VerifyStatus = "idle" | "loading" | "valid" | "revoked" | "superseded" | "invalid_signature" | "not_found" | "error";

type Result = {
  status: VerifyStatus;
  report_id?: string;
  generated_at?: string;
  record_count?: number;
  report_type?: string;
  key_id?: string;
  algorithm?: string;
  format_version?: string;
  revoked_at?: string;
  revocation_reason?: string;
  superseded_by?: string;
};

const STATUS_UI: Record<string, { icon: typeof ShieldCheck; color: string; bg: string; title: string; description: string }> = {
  valid: {
    icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100",
    title: "Relatório autêntico",
    description: "A assinatura criptográfica foi verificada no servidor e o conteúdo do relatório está íntegro.",
  },
  revoked: {
    icon: ShieldOff, color: "text-amber-600", bg: "bg-amber-100",
    title: "Relatório revogado",
    description: "Este relatório foi revogado por um administrador e não deve ser considerado válido.",
  },
  superseded: {
    icon: ShieldOff, color: "text-amber-600", bg: "bg-amber-100",
    title: "Relatório substituído",
    description: "Este relatório foi substituído por uma versão mais recente. Consulte o código do relatório substituto.",
  },
  invalid_signature: {
    icon: ShieldAlert, color: "text-red-600", bg: "bg-red-100",
    title: "Assinatura inválida",
    description: "A assinatura criptográfica não confere. Este relatório pode ter sido alterado ou falsificado.",
  },
  not_found: {
    icon: ShieldQuestion, color: "text-gray-500", bg: "bg-gray-100",
    title: "Não encontrado",
    description: "Nenhum relatório corresponde a este código. Confira se o código foi digitado corretamente.",
  },
};

const VerificarDocumento = () => {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("codigo") ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-public-report", { body: { code: trimmed } });
      if (error) throw error;
      setResult(data as Result);
    } catch {
      setResult({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = params.get("codigo");
    if (initial) verify(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ui = result && result.status !== "error" ? STATUS_UI[result.status] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <img src={logoIcon} alt="Fanaticamente" className="w-16 h-16 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Verificação de documento</h1>
          <p className="text-sm text-gray-500">
            Confira a autenticidade de um relatório de comprovação de aceite emitido pela plataforma Fanaticamente.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(code);
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-gray-500">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código de verificação"
              className="flex-1 h-12 bg-transparent text-sm outline-none font-mono tracking-wider text-gray-800"
              maxLength={32}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full h-12 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40"
          >
            {loading ? "Verificando..." : "Verificar autenticidade"}
          </button>
        </form>

        {result?.status === "error" && (
          <p className="text-center text-sm text-red-600">Não foi possível verificar agora. Tente novamente em instantes.</p>
        )}

        {ui && result && (
          <div className="space-y-4 text-center">
            <div className={`w-16 h-16 rounded-full ${ui.bg} flex items-center justify-center mx-auto`}>
              <ui.icon className={`w-8 h-8 ${ui.color}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${ui.color}`}>{ui.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{ui.description}</p>
            </div>
            {result.status !== "not_found" && (
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1 text-sm text-gray-700 break-all">
                <p><strong>Relatório:</strong> {result.report_id}</p>
                <p><strong>Gerado em:</strong> {result.generated_at ? new Date(result.generated_at).toLocaleString("pt-BR") : "—"}</p>
                <p><strong>Registros:</strong> {result.record_count}</p>
                <p><strong>Tipo:</strong> {result.report_type === "individual" ? "Individual" : "Geral"}</p>
                {result.algorithm && <p><strong>Assinatura:</strong> {result.algorithm} (formato v{result.format_version})</p>}
                {result.status === "revoked" && (
                  <>
                    <p><strong>Revogado em:</strong> {result.revoked_at ? new Date(result.revoked_at).toLocaleString("pt-BR") : "—"}</p>
                    {result.revocation_reason && <p><strong>Justificativa:</strong> {result.revocation_reason}</p>}
                  </>
                )}
                {result.status === "superseded" && result.superseded_by && (
                  <p><strong>Substituído por:</strong> <span className="font-mono">{result.superseded_by}</span></p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 leading-relaxed">
              Esta verificação confirma apenas a autenticidade e integridade do relatório. Nenhum dado pessoal dos
              usuários é exibido nesta consulta, conforme a LGPD.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarDocumento;
