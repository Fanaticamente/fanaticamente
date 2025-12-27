import { useState } from "react";
import { useAppContent, useUpdateContent, useCreateContent, useDeleteContent } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Edit2, Plus, Trash2, Image, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ImageUploader from "./ImageUploader";

const ImageManager = () => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [newImage, setNewImage] = useState({ key: "", description: "" });
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  
  const { data: contents, isLoading } = useAppContent();
  const updateContent = useUpdateContent();
  const createContent = useCreateContent();
  const deleteContent = useDeleteContent();

  const imageContents = contents?.filter(c => c.type === 'image') || [];

  const handleUploadComplete = (url: string) => {
    if (editingKey) {
      // Updating existing image
      updateContent.mutate(
        { key: editingKey, value: url },
        {
          onSuccess: () => {
            toast.success("Imagem atualizada com sucesso!");
            setEditingKey(null);
          },
          onError: () => toast.error("Erro ao atualizar imagem")
        }
      );
    } else {
      // Creating new image - store URL and show key dialog
      setPendingUploadUrl(url);
      setShowUploader(false);
      setShowAddDialog(true);
    }
  };

  const handleCreateImage = async () => {
    if (!newImage.key || !pendingUploadUrl) {
      toast.error("Preencha a chave da imagem");
      return;
    }

    try {
      await createContent.mutateAsync({
        key: newImage.key,
        value: pendingUploadUrl,
        type: 'image',
        category: 'images',
        description: newImage.description || null,
      });
      toast.success("Imagem adicionada com sucesso!");
      setShowAddDialog(false);
      setNewImage({ key: "", description: "" });
      setPendingUploadUrl(null);
    } catch (error) {
      toast.error("Erro ao adicionar imagem");
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      await deleteContent.mutateAsync(key);
      toast.success("Imagem excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir imagem");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Image Button */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setPendingUploadUrl(null);
          setShowUploader(true);
        }}
      >
        <Upload className="w-4 h-4 mr-2" />
        Fazer Upload de Nova Imagem
      </Button>

      {/* Image Uploader Modal */}
      <ImageUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        onUploadComplete={handleUploadComplete}
        title="Upload de Nova Imagem"
      />

      {/* New Image Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Nova Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingUploadUrl && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden max-w-[200px] mx-auto">
                <img
                  src={pendingUploadUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <Label>Chave (identificador único) *</Label>
              <Input
                value={newImage.key}
                onChange={(e) => setNewImage({ ...newImage, key: e.target.value })}
                placeholder="ex: header_logo, hero_background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use snake_case para o identificador
              </p>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={newImage.description}
                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                placeholder="Descreva o uso desta imagem"
              />
            </div>
            <Button onClick={handleCreateImage} className="w-full" disabled={createContent.isPending}>
              {createContent.isPending ? "Salvando..." : "Salvar Imagem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Images Grid */}
      {imageContents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imagem cadastrada</p>
          <p className="text-sm">Faça upload de imagens para gerenciá-las aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {imageContents.map((content) => (
            <div
              key={content.key}
              className="bg-muted/50 border border-border rounded-xl overflow-hidden"
            >
              {/* Image Preview */}
              <div className="aspect-video bg-background/50 relative">
                <img
                  src={content.value}
                  alt={content.description || content.key}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text fill="%23666" font-size="12" x="50" y="50" text-anchor="middle" dominant-baseline="middle">Erro</text></svg>';
                  }}
                />
                <a
                  href={content.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-lg hover:bg-background transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {content.key}
                    </code>
                    {content.description && (
                      <p className="text-xs text-muted-foreground mt-1">{content.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingKey(content.key);
                        setShowUploader(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(content.key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Image Uploader */}
      {editingKey && (
        <ImageUploader
          open={showUploader && !!editingKey}
          onOpenChange={(open) => {
            setShowUploader(open);
            if (!open) setEditingKey(null);
          }}
          onUploadComplete={handleUploadComplete}
          currentImageUrl={imageContents.find(c => c.key === editingKey)?.value}
          title={`Atualizar: ${editingKey}`}
        />
      )}
    </div>
  );
};

export default ImageManager;
