import { useRef, useState } from "react";
import { GraduationCap, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { OnboardingData } from "./OnboardingWizard";

const DEGREE_BASE_OPTIONS = [
  { value: "Psicólogo", label: "Psicólogo" },
  { value: "Psicóloga", label: "Psicóloga" },
];

const DEGREE_TITLE_OPTIONS_MALE = [
  { value: "", label: "Nenhuma titulação adicional" },
  { value: "Mestre em Psicologia", label: "Mestre em Psicologia" },
  { value: "Dr. em Psicologia", label: "Dr. em Psicologia" },
];

const DEGREE_TITLE_OPTIONS_FEMALE = [
  { value: "", label: "Nenhuma titulação adicional" },
  { value: "Mestra em Psicologia", label: "Mestra em Psicologia" },
  { value: "Dra. em Psicologia", label: "Dra. em Psicologia" },
];

interface StepDegreeProps {
  professionalId: string;
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
}

const StepDegree = ({ professionalId, data, onUpdate }: StepDegreeProps) => {
  const { user } = useAuth();
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const titleOptions = data.degreeBase === "Psicóloga" ? DEGREE_TITLE_OPTIONS_FEMALE : DEGREE_TITLE_OPTIONS_MALE;
  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors";

  const handleDocUpload = async (file: File, side: "front" | "back") => {
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
      const path = `${user.id}/degree-${side}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("crp-documents").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: signed, error: sErr } = await supabase.storage.from("crp-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;

      const url = signed.signedUrl;
      const field = side === "front" ? "degree_document_front_url" : "degree_document_back_url";
      await supabase.from("professionals").update({ [field]: url }).eq("id", professionalId);

      onUpdate(side === "front" ? { degreeDocumentFrontUrl: url } : { degreeDocumentBackUrl: url });
      toast.success(`Diploma (${side === "front" ? "frente" : "verso"}) enviado!`);
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
        <GraduationCap className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Sua Formação</h3>
        <p className="text-sm text-muted-foreground mt-1">Informe sua formação e titulação</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-card-foreground mb-2">Formação base *</p>
          <div className="flex gap-2">
            {DEGREE_BASE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({
                  degreeBase: opt.value,
                  degreeTitle: data.degreeBase !== opt.value ? "" : data.degreeTitle,
                  degreeDocumentFrontUrl: data.degreeBase !== opt.value ? "" : data.degreeDocumentFrontUrl,
                  degreeDocumentBackUrl: data.degreeBase !== opt.value ? "" : data.degreeDocumentBackUrl,
                })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  data.degreeBase === opt.value
                    ? "border-therapy bg-therapy/10 text-therapy"
                    : "border-border bg-background text-muted-foreground hover:border-therapy/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-card-foreground mb-2">Titulação adicional (opcional)</p>
          <select
            value={data.degreeTitle}
            onChange={(e) => onUpdate({ degreeTitle: e.target.value })}
            className={inputClassName}
            disabled={!data.degreeBase}
          >
            {titleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {data.degreeTitle && (
          <div className="border border-border rounded-xl p-4 bg-background">
            <p className="text-sm font-medium text-card-foreground mb-2">Diploma de Titulação *</p>
            <p className="text-xs text-muted-foreground mb-4">Foto frente e verso do diploma de {data.degreeTitle}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Frente</label>
                <div
                  className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-therapy transition-colors"
                  onClick={() => frontRef.current?.click()}
                >
                  {data.degreeDocumentFrontUrl ? (
                    <div className="flex items-center gap-2 text-therapy"><CheckCircle className="w-5 h-5" /><span className="text-sm">Enviado</span></div>
                  ) : isUploadingFront ? (
                    <span className="text-sm text-therapy">Enviando...</span>
                  ) : (
                    <div className="text-center p-2"><FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" /><span className="text-xs text-muted-foreground">Enviar</span></div>
                  )}
                </div>
                <input ref={frontRef} type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, "front"); }} className="hidden" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Verso</label>
                <div
                  className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-therapy transition-colors"
                  onClick={() => backRef.current?.click()}
                >
                  {data.degreeDocumentBackUrl ? (
                    <div className="flex items-center gap-2 text-therapy"><CheckCircle className="w-5 h-5" /><span className="text-sm">Enviado</span></div>
                  ) : isUploadingBack ? (
                    <span className="text-sm text-therapy">Enviando...</span>
                  ) : (
                    <div className="text-center p-2"><FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" /><span className="text-xs text-muted-foreground">Enviar</span></div>
                  )}
                </div>
                <input ref={backRef} type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, "back"); }} className="hidden" />
              </div>
            </div>
          </div>
        )}

        {data.degreeBase && (
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Exibição no card:</p>
            <p className="text-sm text-card-foreground font-medium">
              {data.degreeTitle ? `${data.degreeBase}, ${data.degreeTitle}` : data.degreeBase}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepDegree;
