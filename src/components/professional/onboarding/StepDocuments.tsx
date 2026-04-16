import { useRef, useState } from "react";
import { FileText, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OnboardingData } from "./OnboardingWizard";

interface StepDocumentsProps {
  professionalId: string;
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
}

const StepDocuments = ({ professionalId, data, onUpdate }: StepDocumentsProps) => {
  const { user } = useAuth();
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, side: "front" | "back") => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Selecione uma imagem ou PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB");
      return;
    }

    side === "front" ? setIsUploadingFront(true) : setIsUploadingBack(true);
    try {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${side}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("crp-documents").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: signed, error: sErr } = await supabase.storage.from("crp-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;

      const url = signed.signedUrl;

      // Don't save to DB yet — will be saved when onboarding completes
      onUpdate(side === "front" ? { crpDocumentFrontUrl: url } : { crpDocumentBackUrl: url });
      toast.success(`CRP (${side === "front" ? "frente" : "verso"}) enviado!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar documento");
    } finally {
      side === "front" ? setIsUploadingFront(false) : setIsUploadingBack(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <ShieldCheck className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Carteira do CRP</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Envie frente e verso da sua carteira de identificação profissional
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Frente</label>
          <div
            className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-therapy transition-colors"
            onClick={() => frontRef.current?.click()}
          >
            {data.crpDocumentFrontUrl ? (
              <div className="flex items-center gap-2 text-therapy"><CheckCircle className="w-5 h-5" /><span className="text-sm">Enviado</span></div>
            ) : isUploadingFront ? (
              <span className="text-sm text-therapy">Enviando...</span>
            ) : (
              <div className="text-center p-2"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1" /><span className="text-xs text-muted-foreground">Enviar frente</span></div>
            )}
          </div>
          <input ref={frontRef} type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "front"); }} className="hidden" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Verso</label>
          <div
            className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-therapy transition-colors"
            onClick={() => backRef.current?.click()}
          >
            {data.crpDocumentBackUrl ? (
              <div className="flex items-center gap-2 text-therapy"><CheckCircle className="w-5 h-5" /><span className="text-sm">Enviado</span></div>
            ) : isUploadingBack ? (
              <span className="text-sm text-therapy">Enviando...</span>
            ) : (
              <div className="text-center p-2"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1" /><span className="text-xs text-muted-foreground">Enviar verso</span></div>
            )}
          </div>
          <input ref={backRef} type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "back"); }} className="hidden" />
        </div>
      </div>

      {/* CRP number */}
      <div className="mt-5">
        <label className="block text-sm text-card-foreground mb-2">
          Número do CRP <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={data.crp ?? ""}
          onChange={(e) => onUpdate({ crp: formatCRP(e.target.value) })}
          placeholder="06/12345"
          maxLength={8}
          inputMode="numeric"
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-therapy"
        />
        <p className="text-xs text-muted-foreground mt-1">Formato: XX/XXXXX (ex: 06/12345)</p>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Seus documentos serão analisados pela equipe administrativa para verificação.
      </p>
    </div>
  );
};

export default StepDocuments;
