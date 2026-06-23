import { useRef, useState } from "react";
import { FileText, ShieldCheck, Camera } from "lucide-react";
import { toast } from "sonner";
import { uploadProfessionalFile } from "@/lib/professionalUploads";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData } from "./OnboardingWizard";

interface StepDocumentsProps {
  professionalId: string;
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onBusyChange?: (busy: boolean) => void;
}

const formatCRP = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 8)}`;
};

const StepDocuments = ({ professionalId, data, onUpdate, onBusyChange }: StepDocumentsProps) => {
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
    onBusyChange?.(true);
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
      onBusyChange?.(false);
      if (frontRef.current) frontRef.current.value = "";
      if (backRef.current) backRef.current.value = "";
    }
  };

  const renderSlot = (
    side: "front" | "back",
    label: string,
    url: string,
    isUploading: boolean,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => {
    const isPdf = url?.toLowerCase().includes(".pdf");
    const hasFile = !!url;
    return (
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`relative w-full h-32 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors disabled:opacity-60 ${
            hasFile
              ? "border-therapy/60 bg-background"
              : "border-muted-foreground/50 bg-muted/50 hover:border-therapy"
          }`}
          aria-label={hasFile ? `Trocar ${label.toLowerCase()} do CRP` : `Enviar ${label.toLowerCase()} do CRP`}
        >
          {isUploading ? (
            <span className="text-sm text-therapy">Enviando...</span>
          ) : hasFile ? (
            isPdf ? (
              <div className="flex flex-col items-center gap-1 text-therapy">
                <FileText className="w-8 h-8" />
                <span className="text-xs font-medium">PDF enviado</span>
                <span className="text-[10px] text-muted-foreground">Toque para trocar</span>
              </div>
            ) : (
              <>
                <img src={url} alt={`${label} do CRP`} className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                  Trocar
                </span>
              </>
            )
          ) : (
            <div className="text-center p-2">
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Toque para enviar {label.toLowerCase()}</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, side);
          }}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div>
      <div className="text-center mb-6">
        <ShieldCheck className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Carteira do CRP</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Informe seu número do CRP. O envio das fotos da carteira é opcional neste momento.
        </p>
      </div>

      {/* CRP number */}
      <div>
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

      <div className="mt-6">
        <label className="text-xs text-muted-foreground mb-2 block">
          Fotos da carteira (opcional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          {renderSlot("front", "Frente", data.crpDocumentFrontUrl, isUploadingFront, frontRef)}
          {renderSlot("back", "Verso", data.crpDocumentBackUrl, isUploadingBack, backRef)}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Você poderá enviar as fotos da carteira depois, na sua área de profissional.
        </p>
      </div>
    </div>
  );
};

export default StepDocuments;
