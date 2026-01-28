import { useState, useEffect } from "react";
import { 
  X, Save, Upload, Plus, Trash2, Type, Image as ImageIcon, 
  GripVertical, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  Link, Loader2
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppModule, useUpdateModule, useUpdateModuleConfig } from "@/hooks/useAppModules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface FlexibleSectionEditorProps {
  module: AppModule;
  onClose: () => void;
  onSaved?: () => void;
}

interface ContentBlock {
  id: string;
  type: "text" | "image" | "heading" | "button" | "spacer";
  content?: string;
  src?: string;
  alt?: string;
  level?: number;
  alignment?: "left" | "center" | "right";
  link?: string;
  height?: number;
}

const BLOCK_TYPES = [
  { id: "heading", name: "Título", icon: Type },
  { id: "text", name: "Texto", icon: AlignLeft },
  { id: "image", name: "Imagem", icon: ImageIcon },
  { id: "button", name: "Botão", icon: Link },
  { id: "spacer", name: "Espaçador", icon: ChevronDown },
];

const FlexibleSectionEditor = ({ module, onClose, onSaved }: FlexibleSectionEditorProps) => {
  const [name, setName] = useState(module.name);
  const [isVisible, setIsVisible] = useState(module.is_visible);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();
  const updateModule = useUpdateModule();
  const updateConfig = useUpdateModuleConfig();

  useEffect(() => {
    const moduleConfig = typeof module.config === "object" && module.config !== null 
      ? module.config as Record<string, unknown> 
      : {};
    setConfig(moduleConfig);
    
    // Load blocks from config or create default
    const savedBlocks = moduleConfig.blocks as ContentBlock[] | undefined;
    if (savedBlocks && Array.isArray(savedBlocks)) {
      setBlocks(savedBlocks);
    } else {
      setBlocks([
        { id: crypto.randomUUID(), type: "heading", content: "Título da Seção", level: 2, alignment: "center" },
        { id: crypto.randomUUID(), type: "text", content: "Conteúdo de texto aqui...", alignment: "center" },
      ]);
    }
  }, [module]);

  const handleSave = async () => {
    try {
      const newConfig = { ...config, blocks: blocks as unknown as Json };
      
      await Promise.all([
        updateModule.mutateAsync({
          id: module.id,
          updates: { name, is_visible: isVisible },
        }),
        updateConfig.mutateAsync({
          id: module.id,
          config: newConfig as unknown as Json,
        }),
      ]);
      
      await queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      toast.success("Seção salva!");
      onSaved?.();
    } catch {
      // Error handled by mutations
    }
  };

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      alignment: "center",
    };

    switch (type) {
      case "heading":
        newBlock.content = "Novo Título";
        newBlock.level = 2;
        break;
      case "text":
        newBlock.content = "Novo texto...";
        break;
      case "image":
        newBlock.src = "";
        newBlock.alt = "";
        break;
      case "button":
        newBlock.content = "Clique aqui";
        newBlock.link = "#";
        break;
      case "spacer":
        newBlock.height = 40;
        break;
    }

    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `section-${module.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("module-images")
        .getPublicUrl(fileName);
      
      updateBlock(blockId, { src: publicUrl });
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    return (
      <div key={block.id} className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <span className="text-sm font-medium capitalize">{block.type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => moveBlock(index, "up")}
              disabled={index === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => moveBlock(index, "down")}
              disabled={index === blocks.length - 1}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive"
              onClick={() => removeBlock(block.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Block-specific editors */}
        {(block.type === "heading" || block.type === "text" || block.type === "button") && (
          <>
            {block.type === "heading" ? (
              <Input
                value={block.content || ""}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Título"
                className="font-semibold"
              />
            ) : block.type === "text" ? (
              <Textarea
                value={block.content || ""}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Texto..."
                rows={3}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={block.content || ""}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Texto do botão"
                />
                <Input
                  value={block.link || ""}
                  onChange={(e) => updateBlock(block.id, { link: e.target.value })}
                  placeholder="Link (URL)"
                />
              </div>
            )}
            
            {/* Alignment */}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Alinhamento:</Label>
              <div className="flex gap-1">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={block.alignment === value ? "default" : "outline"}
                    className="h-7 w-7 p-0"
                    onClick={() => updateBlock(block.id, { alignment: value as ContentBlock["alignment"] })}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Heading level */}
            {block.type === "heading" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Nível:</Label>
                <Select
                  value={String(block.level || 2)}
                  onValueChange={(v) => updateBlock(block.id, { level: parseInt(v) })}
                >
                  <SelectTrigger className="w-24 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1 (Grande)</SelectItem>
                    <SelectItem value="2">H2 (Médio)</SelectItem>
                    <SelectItem value="3">H3 (Pequeno)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {block.type === "image" && (
          <div className="space-y-2">
            {block.src ? (
              <div className="relative rounded-lg overflow-hidden group">
                <img src={block.src} alt={block.alt || ""} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="p-2 bg-white/20 rounded-lg cursor-pointer hover:bg-white/30">
                    <Upload className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, block.id);
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, block.id);
                  }}
                />
              </label>
            )}
            <Input
              value={block.alt || ""}
              onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
              placeholder="Texto alternativo (alt)"
              className="text-sm"
            />
          </div>
        )}

        {block.type === "spacer" && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Altura:</Label>
            <Input
              type="number"
              value={block.height || 40}
              onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) })}
              className="w-20 h-7"
              min={10}
              max={200}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
          <span className="font-medium text-sm truncate max-w-[200px]">{module.name}</span>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="w-4 h-4" />
          Salvar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Settings */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs">Nome da Seção</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">Seção Visível</Label>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Blocos de Conteúdo</Label>
          </div>

          {blocks.map((block, index) => renderBlockEditor(block, index))}

          {/* Add Block Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {BLOCK_TYPES.map((type) => (
              <Button
                key={type.id}
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => addBlock(type.id as ContentBlock["type"])}
              >
                <Plus className="w-3 h-3" />
                <type.icon className="w-3 h-3" />
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleSectionEditor;
