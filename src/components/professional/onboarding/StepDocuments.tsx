import { useRef, useState } from "react";
import { FileText, CheckCircle, ShieldCheck, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadProfessionalFile } from "@/lib/professionalUploads";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData } from "./OnboardingWizard";

interface StepDocumentsProps {
  professionalId: string;
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
}

const formatCRP = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 8)}`;
};

const StepDocuments = ({ professionalId, data, onUpdate }: StepDocumentsProps) => {
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const frontCamRef = useRef<HTMLInputElement>(null);
  const backCamRef = useRef<HTMLInputElement>(null);

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
      const { url } = await uploadProfessionalFile(file, side === "front" ? "crp-front" : "crp-back");

      onUpdate(side === "front" ? { crpDocumentFrontUrl: url } : { crpDocumentBackUrl: url });
      // Persist immediately so the user can resume from where they stopped
      await supabase
        .from("professionals")
        .update(side === "front" ? { crp_document_front_url: url } : { crp_document_back_url: url })
        .eq("id", professionalId);
      toast.success(`CRP (${side === "front" ? "frente" : "verso"}) enviado!`);
    } catch (e: any) {
      console.error("[StepDocuments] Upload error:", e);
      toast.error(`Erro ao enviar documento: ${e?.message || "tente novamente"}`);
    } finally {
      side === "front" ? setIsUploadingFront(false) : setIsUploadingBack(false);
      if (frontRef.current) frontRef.current.value = "";
      if (backRef.current) backRef.current.value = "";
      if (frontCamRef.current) frontCamRef.current.value = "";
      if (backCamRef.current) backCamRef.current.value = "";
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
          <input ref={frontCamRef} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "front"); }} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => frontCamRef.current?.click()} disabled={isUploadingFront} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-therapy text-white text-xs font-medium hover:bg-therapy/90 disabled:opacity-50">
              <Camera className="w-3.5 h-3.5" /> Câmera
            </button>
            <button type="button" onClick={() => frontRef.current?.click()} disabled={isUploadingFront} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-border bg-background text-xs font-medium text-card-foreground hover:bg-muted disabled:opacity-50">
              <ImageIcon className="w-3.5 h-3.5" /> Arquivo
            </button>
          </div>
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
          <input ref={backCamRef} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "back"); }} className="hidden" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => backCamRef.current?.click()} disabled={isUploadingBack} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-therapy text-white text-xs font-medium hover:bg-therapy/90 disabled:opacity-50">
              <Camera className="w-3.5 h-3.5" /> Câmera
            </button>
            <button type="button" onClick={() => backRef.current?.click()} disabled={isUploadingBack} className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-border bg-background text-xs font-medium text-card-foreground hover:bg-muted disabled:opacity-50">
              <ImageIcon className="w-3.5 h-3.5" /> Arquivo
            </button>
          </div>
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
