import { useEffect, useState } from "react";
import { X, Upload, Trash2, AlignLeft, AlignCenter, AlignRight, Loader2 } from "lucide-react";
import { useVisualEditor } from "./VisualEditorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VisualEditorPanel = () => {
  const { selectedElement, setSelectedElement, updateBlockData } = useVisualEditor();
  const [localData, setLocalData] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedElement) {
      setLocalData(selectedElement.blockData);
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  const handleUpdate = (key: string, value: unknown) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    updateBlockData(selectedElement.moduleId, selectedElement.blockId, { [key]: value });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `visual-${selectedElement.moduleId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("module-images")
        .getPublicUrl(fileName);

      handleUpdate("src", publicUrl);
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const renderImageEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Imagem</Label>
        {localData.src ? (
          <div className="relative">
            <img
              src={localData.src as string}
              alt=""
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={() => handleUpdate("src", "")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para enviar</span>
              </>
            )}
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label>Texto alternativo</Label>
        <Input
          value={(localData.alt as string) || ""}
          onChange={(e) => handleUpdate("alt", e.target.value)}
          placeholder="Descrição da imagem"
        />
      </div>

      <div className="space-y-2">
        <Label>Largura</Label>
        <Select
          value={(localData.width as string) || "full"}
          onValueChange={(v) => handleUpdate("width", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">100%</SelectItem>
            <SelectItem value="2/3">66%</SelectItem>
            <SelectItem value="1/2">50%</SelectItem>
            <SelectItem value="1/3">33%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex gap-1">
          {[
            { value: "left", icon: AlignLeft },
            { value: "center", icon: AlignCenter },
            { value: "right", icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={localData.alignment === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleUpdate("alignment", value)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderButtonEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto do botão</Label>
        <Input
          value={(localData.content as string) || ""}
          onChange={(e) => handleUpdate("content", e.target.value)}
          placeholder="Clique aqui"
        />
      </div>

      <div className="space-y-2">
        <Label>Link (URL)</Label>
        <Input
          value={(localData.link as string) || ""}
          onChange={(e) => handleUpdate("link", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex gap-1">
          {[
            { value: "left", icon: AlignLeft },
            { value: "center", icon: AlignCenter },
            { value: "right", icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={localData.alignment === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleUpdate("alignment", value)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTextEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          value={(localData.content as string) || ""}
          onChange={(e) => handleUpdate("content", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex gap-1">
          {[
            { value: "left", icon: AlignLeft },
            { value: "center", icon: AlignCenter },
            { value: "right", icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={localData.alignment === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleUpdate("alignment", value)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor do texto</Label>
        <Select
          value={(localData.textColor as string) || "white"}
          onValueChange={(v) => handleUpdate("textColor", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="white">Branco</SelectItem>
            <SelectItem value="gray">Cinza claro</SelectItem>
            <SelectItem value="muted">Cinza escuro</SelectItem>
            <SelectItem value="accent">Accent (verde)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Peso da fonte</Label>
        <Select
          value={(localData.fontWeight as string) || "normal"}
          onValueChange={(v) => handleUpdate("fontWeight", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderHeadingEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={(localData.content as string) || ""}
          onChange={(e) => handleUpdate("content", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tamanho</Label>
        <Select
          value={String((localData.level as number) || 2)}
          onValueChange={(v) => handleUpdate("level", parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1 (Extra grande)</SelectItem>
            <SelectItem value="2">H2 (Grande)</SelectItem>
            <SelectItem value="3">H3 (Médio)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderTextEditor()}
    </div>
  );

  const renderSpacerEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Altura: {(localData.height as number) || 40}px</Label>
        <Slider
          value={[(localData.height as number) || 40]}
          onValueChange={([v]) => handleUpdate("height", v)}
          min={10}
          max={200}
          step={10}
        />
      </div>
    </div>
  );

  const renderCardEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          value={(localData.content as string) || ""}
          onChange={(e) => handleUpdate("content", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Cor de fundo</Label>
        <Select
          value={(localData.backgroundColor as string) || "#f5f5f5"}
          onValueChange={(v) => handleUpdate("backgroundColor", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="#f5f5f5">Cinza claro</SelectItem>
            <SelectItem value="#1a1a1a">Cinza escuro</SelectItem>
            <SelectItem value="#0a0a0a">Preto</SelectItem>
            <SelectItem value="#10b981">Accent</SelectItem>
            <SelectItem value="transparent">Transparente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Padding</Label>
        <Select
          value={(localData.padding as string) || "medium"}
          onValueChange={(v) => handleUpdate("padding", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (selectedElement.blockType) {
      case "image":
        return renderImageEditor();
      case "button":
        return renderButtonEditor();
      case "heading":
        return renderHeadingEditor();
      case "text":
        return renderTextEditor();
      case "spacer":
        return renderSpacerEditor();
      case "card":
        return renderCardEditor();
      default:
        return <p className="text-muted-foreground">Editor não disponível para este tipo.</p>;
    }
  };

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold capitalize">{selectedElement.blockType}</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setSelectedElement(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderEditor()}
      </div>
    </div>
  );
};

export default VisualEditorPanel;
