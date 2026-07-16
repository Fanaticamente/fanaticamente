import { useState, useRef } from "react";
import { Upload, Camera, Info, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadProfessionalFile } from "@/lib/professionalUploads";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import photoExampleFemaleAsset from "@/assets/onboarding-photo-example-female.png.asset.json";
import photoExampleMaleAsset from "@/assets/onboarding-photo-example-male.png.asset.json";

const photoExampleFemale = photoExampleFemaleAsset.url;
const photoExampleMale = photoExampleMaleAsset.url;

interface StepPhotoProps {
  professionalId: string;
  imageUrl: string;
  onUpdate: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

const StepPhoto = ({ professionalId, imageUrl, onUpdate, onBusyChange }: StepPhotoProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    onBusyChange?.(true);
    try {
      const { url } = await uploadProfessionalFile(file, "avatar");
      onUpdate(url);
      // Persist immediately so the user can resume from where they stopped
      if (user) {
        await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      }
      toast.success("Foto enviada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Erro ao enviar imagem: ${error?.message || "tente novamente"}`);
    } finally {
      setIsUploading(false);
      onBusyChange?.(false);
      // Reset the input so the same file can be re-selected after an error.
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  return (
    <div className="text-center">
      <div className="mb-4">
        <Camera className="w-10 h-10 text-therapy mx-auto mb-2" />
        <h3 className="font-display text-xl text-card-foreground">Sua Foto Profissional</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Essa foto será exibida no seu card no marketplace
        </p>
      </div>

      <div
        className="w-40 h-52 mx-auto rounded-2xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="text-center p-4">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <span className="text-sm text-muted-foreground">Toque para enviar</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      {/* Dedicated camera input — `capture` opens the native camera on mobile.
          Must stay in the synchronous click handler to preserve the user gesture. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleUpload}
        className="hidden"
      />

      {isUploading && <p className="text-therapy text-sm">Enviando...</p>}

      <div className="flex gap-2 justify-center mt-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-therapy text-white text-sm font-medium hover:bg-therapy/90 disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Tirar foto
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-sm font-medium text-card-foreground hover:bg-muted disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          {imageUrl ? "Trocar foto" : "Galeria"}
        </button>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 border border-border mt-4 text-left">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-therapy mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-card-foreground mb-1">Diretrizes para a foto:</p>
            <p>• Foto profissional apenas com fundo neutro</p>
            <p>• Rosto visível e boa iluminação</p>
            <p>• Formato vertical (7:9) • Máx. 5MB</p>
            <p>• Siga o padrão de exemplo nas imagens abaixo.</p>
            <p>• Utilize uma vestimenta na cor predominante ou na cor padrão da equipe esportiva com a qual você se identifica.</p>
            <p>• É vedado o uso da camiseta oficial do clube ou de qualquer uniforme oficial da equipe.</p>
            <p>• A vestimenta deve apenas remeter às cores que representam a equipe esportiva escolhida.</p>
            <p>• Caso você não possua uma vestimenta com essas características, sugerimos editar uma foto de sua preferência para adequá-la a esta diretriz, preservando uma aparência natural e profissional.</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
            <img
              src={photoExampleFemale}
              alt="Exemplo de foto profissional feminina vestindo camisa do time"
              className="w-full aspect-[7/9] object-cover object-top"
            />
          </div>
          <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
            <img
              src={photoExampleMale}
              alt="Exemplo de foto profissional masculina vestindo camisa do time"
              className="w-full aspect-[7/9] object-cover object-top"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 italic">
          Exemplos de poses e enquadramento ideais — para criar identificação com a torcida.
        </p>
      </div>
    </div>
  );
};

export default StepPhoto;
