import { useState } from "react";
import { useAppContent, useUpdateContent, useCreateContent, useDeleteContent } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Edit2, Save, X, Plus, Trash2, Image, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ImageManager = () => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newImage, setNewImage] = useState({ key: "", value: "", description: "" });
  
  const { data: contents, isLoading } = useAppContent();
  const updateContent = useUpdateContent();
  const createContent = useCreateContent();
  const deleteContent = useDeleteContent();

  const imageContents = contents?.filter(c => c.type === 'image') || [];

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    try {
      await updateContent.mutateAsync({ key, value: editValue });
      toast.success("Imagem atualizada com sucesso!");
      setEditingKey(null);
    } catch (error) {
      toast.error("Erro ao atualizar imagem");
    }
  };

  const handleAddImage = async () => {
    if (!newImage.key || !newImage.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createContent.mutateAsync({
        key: newImage.key,
        value: newImage.value,
        type: 'image',
        category: 'images',
        description: newImage.description || null,
      });
      toast.success("Imagem adicionada com sucesso!");
      setShowAddDialog(false);
      setNewImage({ key: "", value: "", description: "" });
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Imagem
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chave (identificador único)</Label>
              <Input
                value={newImage.key}
                onChange={(e) => setNewImage({ ...newImage, key: e.target.value })}
                placeholder="ex: hero_background"
              />
            </div>
            <div>
              <Label>URL da Imagem</Label>
              <Input
                value={newImage.value}
                onChange={(e) => setNewImage({ ...newImage, value: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={newImage.description}
                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                placeholder="Descreva o uso desta imagem"
              />
            </div>
            <Button onClick={handleAddImage} className="w-full">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Images Grid */}
      {imageContents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imagem cadastrada</p>
          <p className="text-sm">Adicione imagens para gerenciá-las aqui</p>
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
                      onClick={() => handleEdit(content.key, content.value)}
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

                {editingKey === content.key && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Nova URL"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(content.key)}
                      disabled={updateContent.isPending}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageManager;
