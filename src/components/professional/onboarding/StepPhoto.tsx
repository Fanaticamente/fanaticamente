import { useState, useRef } from "react";
import { Upload, Camera, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StepPhotoProps {
  professionalId: string;
  imageUrl: string;
  onUpdate: (url: string) => void;
}

const StepPhoto = ({ professionalId, imageUrl, onUpdate }: StepPhotoProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `professionals/${professionalId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (user) {
        await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      }

      onUpdate(publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
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

      {isUploading && <p className="text-therapy text-sm">Enviando...</p>}

      {imageUrl && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-therapy underline"
        >
          Trocar foto
        </button>
      )}

      <div className="bg-muted/30 rounded-lg p-3 border border-border mt-4 text-left">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-therapy mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-card-foreground mb-1">Dicas para uma boa foto:</p>
            <p>• Foto profissional com fundo neutro</p>
            <p>• Rosto visível e boa iluminação</p>
            <p>• Formato vertical (7:9) • Máx. 5MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepPhoto;
