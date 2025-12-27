import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  title?: string;
}

const ImageUploader = ({ 
  open, 
  onOpenChange, 
  onUploadComplete, 
  currentImageUrl,
  title = "Upload de Imagem"
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUrlInput("");
  };

  const handleUpload = async () => {
    // If URL is provided, use it directly
    if (urlInput.trim()) {
      onUploadComplete(urlInput.trim());
      handleClose();
      return;
    }

    if (!selectedFile) {
      toast.error("Selecione uma imagem ou insira uma URL");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('app-assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      onUploadComplete(urlData.publicUrl);
      toast.success("Imagem enviada com sucesso!");
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUrlInput("");
    onOpenChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUrlInput("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Image */}
          {currentImageUrl && !previewUrl && (
            <div className="space-y-2">
              <Label>Imagem Atual</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt="Current"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors hover:border-primary hover:bg-primary/5
              ${previewUrl ? 'border-primary bg-primary/5' : 'border-border'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mx-auto max-w-[200px]">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste uma imagem
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou GIF (máx. 5MB)
                </p>
              </>
            )}
          </div>

          {/* Or divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label>URL da Imagem</Label>
            <Input
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (e.target.value) {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }
              }}
              placeholder="https://exemplo.com/imagem.png"
            />
          </div>

          {/* URL Preview */}
          {urlInput && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={urlInput}
                alt="URL Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text fill="%23666" font-size="10" x="50" y="50" text-anchor="middle" dominant-baseline="middle">URL inválida</text></svg>';
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || (!selectedFile && !urlInput)}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploader;
