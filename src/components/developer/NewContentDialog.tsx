import { useState } from "react";
import { useCreateContent } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewContentDialogProps {
  categories: string[];
}

const NewContentDialog = ({ categories }: NewContentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    type: "text" as 'text' | 'image' | 'json',
    category: "general",
    description: "",
  });

  const createContent = useCreateContent();

  const handleSubmit = async () => {
    if (!formData.key || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await createContent.mutateAsync({
        key: formData.key,
        value: formData.value,
        type: formData.type,
        category: formData.category,
        description: formData.description || null,
      });
      toast.success("Conteúdo criado com sucesso!");
      setOpen(false);
      setFormData({
        key: "",
        value: "",
        type: "text",
        category: "general",
        description: "",
      });
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast.error("Já existe um conteúdo com esta chave");
      } else {
        toast.error("Erro ao criar conteúdo");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo Conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Conteúdo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Chave *</Label>
            <Input
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="ex: home_title"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Identificador único, use snake_case
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'text' | 'image' | 'json') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="image">Imagem (URL)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="general">general</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Valor *</Label>
            {formData.type === 'text' ? (
              <Textarea
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Conteúdo do texto"
                rows={4}
              />
            ) : (
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'image' ? "https://..." : '{"key": "value"}'}
              />
            )}
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva onde este conteúdo é usado"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createContent.isPending}
            className="w-full"
          >
            Criar Conteúdo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewContentDialog;
