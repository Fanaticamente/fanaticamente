import { useState, useEffect } from "react";
import { 
  X, Save, Upload, Plus, Trash2, Type, Image as ImageIcon, 
  GripVertical, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  Link, Loader2, Columns2, Square, PanelLeft, PanelRight, Palette
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
  type: "text" | "image" | "heading" | "button" | "spacer" | "card";
  content?: string;
  src?: string;
  alt?: string;
  level?: number;
  alignment?: "left" | "center" | "right";
  link?: string;
  height?: number;
  width?: "full" | "2/3" | "1/2" | "1/3";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textColor?: "white" | "gray" | "muted" | "accent";
  backgroundColor?: string;
  column?: "left" | "right" | "full";
  padding?: "none" | "small" | "medium" | "large";
}

interface SectionLayout {
  type: "single" | "two-column" | "left-wide" | "right-wide";
  backgroundColor?: string;
  containerWidth?: "full" | "narrow" | "wide";
  verticalPadding?: "small" | "medium" | "large";
}

const BLOCK_TYPES = [
  { id: "heading", name: "Título", icon: Type },
  { id: "text", name: "Texto", icon: AlignLeft },
  { id: "image", name: "Imagem", icon: ImageIcon },
  { id: "button", name: "Botão", icon: Link },
  { id: "card", name: "Card", icon: Square },
  { id: "spacer", name: "Espaçador", icon: ChevronDown },
];

const LAYOUT_TYPES = [
  { id: "single", name: "Coluna única", icon: Square },
  { id: "two-column", name: "Duas colunas", icon: Columns2 },
  { id: "left-wide", name: "Esquerda maior", icon: PanelLeft },
  { id: "right-wide", name: "Direita maior", icon: PanelRight },
];

const BACKGROUND_COLORS = [
  { id: "transparent", name: "Transparente", color: "transparent" },
  { id: "dark", name: "Escuro", color: "#0a0a0a" },
  { id: "darker", name: "Mais escuro", color: "#050505" },
  { id: "gray", name: "Cinza", color: "#1a1a1a" },
  { id: "light-gray", name: "Cinza claro", color: "#f5f5f5" },
  { id: "accent", name: "Accent", color: "#10b981" },
];

const FlexibleSectionEditor = ({ module, onClose, onSaved }: FlexibleSectionEditorProps) => {
  const [name, setName] = useState(module.name);
  const [isVisible, setIsVisible] = useState(module.is_visible);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [layout, setLayout] = useState<SectionLayout>({ 
    type: "single", 
    backgroundColor: "#0a0a0a",
    containerWidth: "wide",
    verticalPadding: "medium"
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();
  const updateModule = useUpdateModule();
  const updateConfig = useUpdateModuleConfig();

  useEffect(() => {
    const moduleConfig = typeof module.config === "object" && module.config !== null 
      ? module.config as Record<string, unknown> 
      : {};
    setConfig(moduleConfig);
    
    // Load layout from config
    const savedLayout = moduleConfig.layout as SectionLayout | undefined;
    if (savedLayout) {
      setLayout(savedLayout);
    }
    
    // Load blocks from config or create default
    const savedBlocks = moduleConfig.blocks as ContentBlock[] | undefined;
    if (savedBlocks && Array.isArray(savedBlocks)) {
      setBlocks(savedBlocks);
    } else {
      setBlocks([
        { id: crypto.randomUUID(), type: "heading", content: "Título da Seção", level: 2, alignment: "left", column: "full", fontWeight: "bold", textColor: "white" },
        { id: crypto.randomUUID(), type: "text", content: "Conteúdo de texto aqui...", alignment: "left", column: "full", textColor: "gray" },
      ]);
    }
  }, [module]);

  const handleSave = async () => {
    try {
      const newConfig = { ...config, blocks: blocks as unknown as Json, layout: layout as unknown as Json };
      
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
      await queryClient.invalidateQueries({ queryKey: ["desktop-modules-preview"] });
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
      alignment: "left",
      column: layout.type === "single" ? "full" : "left",
      fontWeight: "normal",
      textColor: "white",
    };

    switch (type) {
      case "heading":
        newBlock.content = "Novo Título";
        newBlock.level = 2;
        newBlock.fontWeight = "bold";
        break;
      case "text":
        newBlock.content = "Novo texto...";
        newBlock.textColor = "gray";
        break;
      case "image":
        newBlock.src = "";
        newBlock.alt = "";
        newBlock.width = "full";
        break;
      case "button":
        newBlock.content = "Clique aqui";
        newBlock.link = "#";
        break;
      case "card":
        newBlock.content = "Conteúdo do card";
        newBlock.backgroundColor = "#f5f5f5";
        newBlock.padding = "medium";
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
    const showColumnSelector = layout.type !== "single";
    
    return (
      <div key={block.id} className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <span className="text-sm font-medium capitalize">{block.type}</span>
            {showColumnSelector && (
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded">
                {block.column === "left" ? "Esq" : block.column === "right" ? "Dir" : "Total"}
              </span>
            )}
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

        {/* Column selector for multi-column layouts */}
        {showColumnSelector && (
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Label className="text-xs">Coluna:</Label>
            <Select
              value={block.column || "full"}
              onValueChange={(v) => updateBlock(block.id, { column: v as ContentBlock["column"] })}
            >
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
                <SelectItem value="full">Largura total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
            
            {/* Alignment & Typography Controls */}
            <div className="grid grid-cols-2 gap-2">
              {/* Alignment */}
              <div className="flex items-center gap-2">
                <Label className="text-xs">Alinhar:</Label>
                <div className="flex gap-0.5">
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
                      <Icon className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Font Weight (for heading and text) */}
              {(block.type === "heading" || block.type === "text") && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Peso:</Label>
                  <Select
                    value={block.fontWeight || "normal"}
                    onValueChange={(v) => updateBlock(block.id, { fontWeight: v as ContentBlock["fontWeight"] })}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
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
              )}
            </div>

            {/* Text Color */}
            {(block.type === "heading" || block.type === "text") && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Cor do texto:</Label>
                <Select
                  value={block.textColor || "white"}
                  onValueChange={(v) => updateBlock(block.id, { textColor: v as ContentBlock["textColor"] })}
                >
                  <SelectTrigger className="w-32 h-7 text-xs">
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
            )}

            {/* Heading level */}
            {block.type === "heading" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Tamanho:</Label>
                <Select
                  value={String(block.level || 2)}
                  onValueChange={(v) => updateBlock(block.id, { level: parseInt(v) })}
                >
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1 (Extra grande)</SelectItem>
                    <SelectItem value="2">H2 (Grande)</SelectItem>
                    <SelectItem value="3">H3 (Médio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Card block editor */}
        {block.type === "card" && (
          <div className="space-y-2">
            <Textarea
              value={block.content || ""}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Conteúdo do card..."
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Fundo:</Label>
                <Select
                  value={block.backgroundColor || "#f5f5f5"}
                  onValueChange={(v) => updateBlock(block.id, { backgroundColor: v })}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
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
              <div className="flex items-center gap-2">
                <Label className="text-xs">Padding:</Label>
                <Select
                  value={block.padding || "medium"}
                  onValueChange={(v) => updateBlock(block.id, { padding: v as ContentBlock["padding"] })}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
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
            <div className="flex items-center gap-2">
              <Label className="text-xs">Alinhar:</Label>
              <div className="flex gap-0.5">
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
                    <Icon className="w-3 h-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
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
            <div className="flex items-center gap-2">
              <Label className="text-xs">Largura:</Label>
              <Select
                value={block.width || "full"}
                onValueChange={(v) => updateBlock(block.id, { width: v as ContentBlock["width"] })}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
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

        {/* Layout Settings */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Columns2 className="w-4 h-4" />
            Layout da Seção
          </Label>
          
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_TYPES.map((lt) => (
              <Button
                key={lt.id}
                variant={layout.type === lt.id ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2 h-9"
                onClick={() => setLayout({ ...layout, type: lt.id as SectionLayout["type"] })}
              >
                <lt.icon className="w-4 h-4" />
                <span className="text-xs">{lt.name}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Fundo
              </Label>
              <Select
                value={layout.backgroundColor || "#0a0a0a"}
                onValueChange={(v) => setLayout({ ...layout, backgroundColor: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BACKGROUND_COLORS.map((c) => (
                    <SelectItem key={c.id} value={c.color}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded border border-border" 
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Espaço vertical</Label>
              <Select
                value={layout.verticalPadding || "medium"}
                onValueChange={(v) => setLayout({ ...layout, verticalPadding: v as SectionLayout["verticalPadding"] })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
