import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon, Type, Upload, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppModule, useUpdateModule, useUpdateModuleConfig } from "@/hooks/useAppModules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { DynamicSectionConfig, ContentBlock, ColumnConfig } from "./DynamicSectionRenderer";

interface AdvancedSectionEditorProps {
  module: AppModule;
  onClose: () => void;
  onSaved?: () => void;
}

const AdvancedSectionEditor = ({ module, onClose, onSaved }: AdvancedSectionEditorProps) => {
  const [name, setName] = useState(module.name);
  const [isVisible, setIsVisible] = useState(module.is_visible);
  const [config, setConfig] = useState<DynamicSectionConfig>(
    module.config as unknown as DynamicSectionConfig || getDefaultConfig()
  );
  const [uploading, setUploading] = useState(false);
  const [activeColumn, setActiveColumn] = useState<"left" | "right" | "single">("single");

  const queryClient = useQueryClient();
  const updateModule = useUpdateModule();
  const updateConfig = useUpdateModuleConfig();

  useEffect(() => {
    setName(module.name);
    setIsVisible(module.is_visible);
    setConfig(module.config as unknown as DynamicSectionConfig || getDefaultConfig());
  }, [module]);

  function getDefaultConfig(): DynamicSectionConfig {
    return {
      layoutType: "single",
      backgroundColor: "#ffffff",
      paddingTop: 80,
      paddingBottom: 80,
      marginTop: 0,
      marginBottom: 0,
      maxWidth: "7xl",
      overflow: "hidden",
      columnGap: 64,
      singleColumn: { blocks: [], alignment: "start" },
      leftColumn: { blocks: [], alignment: "start" },
      rightColumn: { blocks: [], alignment: "start" },
    };
  }

  const handleSave = async () => {
    try {
      await Promise.all([
        updateModule.mutateAsync({
          id: module.id,
          updates: { name, is_visible: isVisible },
        }),
        updateConfig.mutateAsync({
          id: module.id,
          config: config as unknown as Json,
        }),
      ]);

      await queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      await queryClient.invalidateQueries({ queryKey: ["desktop-modules-preview"] });

      toast.success("Seção salva com sucesso!");
      onSaved?.();
    } catch {
      toast.error("Erro ao salvar seção");
    }
  };

  const handleImageUpload = async (file: File, blockId: string, columnKey: "leftColumn" | "rightColumn" | "singleColumn") => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `desktop-${module.module_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("module-images")
        .getPublicUrl(fileName);

      const column = config[columnKey];
      if (column) {
        const newBlocks = column.blocks.map((b: ContentBlock) => 
          b.id === blockId && b.type === "image" ? { ...b, src: publicUrl } : b
        );
        setConfig({ ...config, [columnKey]: { ...column, blocks: newBlocks } });
      }

      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const addBlock = (type: ContentBlock["type"], columnKey: "leftColumn" | "rightColumn" | "singleColumn") => {
    const column = config[columnKey] || { blocks: [], alignment: "start" };
    const newBlock = createBlock(type);
    setConfig({
      ...config,
      [columnKey]: { ...column, blocks: [...column.blocks, newBlock] },
    });
  };

  const createBlock = (type: ContentBlock["type"]): ContentBlock => {
    const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case "heading":
        return { id, type: "heading", content: "Título", level: 2, fontWeight: "bold", color: "#000000", alignment: "left", marginBottom: 24 };
      case "text":
        return { id, type: "text", content: "Texto de exemplo...", fontSize: "lg", fontWeight: "normal", color: "#374151", alignment: "left", marginBottom: 16 };
      case "image":
        return { id, type: "image", src: "", alt: "", width: "100%", alignment: "left", marginBottom: 16 };
      case "spacer":
        return { id, type: "spacer", height: 32 };
      case "button":
        return { id, type: "button", label: "Clique aqui", link: "#", variant: "primary", alignment: "left" };
      default:
        return { id, type: "text", content: "" };
    }
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>, columnKey: "leftColumn" | "rightColumn" | "singleColumn") => {
    const column = config[columnKey];
    if (!column) return;

    const newBlocks = column.blocks.map((b: ContentBlock) =>
      b.id === blockId ? { ...b, ...updates } : b
    );
    setConfig({ ...config, [columnKey]: { ...column, blocks: newBlocks } });
  };

  const removeBlock = (blockId: string, columnKey: "leftColumn" | "rightColumn" | "singleColumn") => {
    const column = config[columnKey];
    if (!column) return;

    const newBlocks = column.blocks.filter((b: ContentBlock) => b.id !== blockId);
    setConfig({ ...config, [columnKey]: { ...column, blocks: newBlocks } });
  };

  const moveBlock = (blockId: string, direction: "up" | "down", columnKey: "leftColumn" | "rightColumn" | "singleColumn") => {
    const column = config[columnKey];
    if (!column) return;

    const blocks = [...column.blocks];
    const index = blocks.findIndex((b: ContentBlock) => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    setConfig({ ...config, [columnKey]: { ...column, blocks } });
  };

  const renderBlockEditor = (block: ContentBlock, columnKey: "leftColumn" | "rightColumn" | "singleColumn", index: number, totalBlocks: number) => {
    return (
      <AccordionItem value={block.id} key={block.id} className="border rounded-lg mb-2 bg-muted/30">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            {block.type === "heading" && <Type className="w-4 h-4" />}
            {block.type === "text" && <Type className="w-4 h-4" />}
            {block.type === "image" && <ImageIcon className="w-4 h-4" />}
            <span className="text-sm font-medium capitalize">
              {block.type === "heading" ? "Título" : block.type === "text" ? "Texto" : block.type === "image" ? "Imagem" : block.type === "spacer" ? "Espaçador" : "Botão"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto mr-2">
              {block.type === "heading" || block.type === "text" 
                ? `"${(block as any).content?.slice(0, 20)}${(block as any).content?.length > 20 ? "..." : ""}"` 
                : ""}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 space-y-3">
          {/* Common controls */}
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveBlock(block.id, "up", columnKey)} disabled={index === 0}>
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveBlock(block.id, "down", columnKey)} disabled={index === totalBlocks - 1}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => removeBlock(block.id, columnKey)}>
              <Trash2 className="w-4 h-4 mr-1" /> Remover
            </Button>
          </div>

          {/* Block-specific editors */}
          {(block.type === "heading" || block.type === "text") && (
            <>
              <div>
                <Label className="text-xs">Conteúdo</Label>
                <Textarea
                  value={(block as any).content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value }, columnKey)}
                  placeholder="Digite o texto..."
                  className="mt-1"
                  rows={block.type === "text" ? 4 : 2}
                />
                {block.type === "text" && (
                  <p className="text-xs text-muted-foreground mt-1">Use **texto** para negrito</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {block.type === "heading" && (
                  <div>
                    <Label className="text-xs">Nível</Label>
                    <Select value={String((block as any).level || 2)} onValueChange={(v) => updateBlock(block.id, { level: parseInt(v) as 1 | 2 | 3 | 4 }, columnKey)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">H1 (maior)</SelectItem>
                        <SelectItem value="2">H2</SelectItem>
                        <SelectItem value="3">H3</SelectItem>
                        <SelectItem value="4">H4 (menor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {block.type === "text" && (
                  <div>
                    <Label className="text-xs">Tamanho</Label>
                    <Select value={(block as any).fontSize || "lg"} onValueChange={(v) => updateBlock(block.id, { fontSize: v as "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" }, columnKey)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Pequeno</SelectItem>
                        <SelectItem value="base">Normal</SelectItem>
                        <SelectItem value="lg">Grande</SelectItem>
                        <SelectItem value="xl">Muito grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Peso</Label>
                  <Select value={(block as any).fontWeight || "normal"} onValueChange={(v) => updateBlock(block.id, { fontWeight: v as "normal" | "medium" | "semibold" | "bold" }, columnKey)}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Negrito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Alinhamento</Label>
                  <Select value={(block as any).alignment || "left"} onValueChange={(v) => updateBlock(block.id, { alignment: v as "left" | "center" | "right" }, columnKey)}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Cor</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      type="color"
                      value={(block as any).color || "#000000"}
                      onChange={(e) => updateBlock(block.id, { color: e.target.value }, columnKey)}
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={(block as any).color || "#000000"}
                      onChange={(e) => updateBlock(block.id, { color: e.target.value }, columnKey)}
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Margem Superior (px)</Label>
                  <Input
                    type="number"
                    value={(block as any).marginTop || 0}
                    onChange={(e) => updateBlock(block.id, { marginTop: parseInt(e.target.value) || 0 }, columnKey)}
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Margem Inferior (px)</Label>
                  <Input
                    type="number"
                    value={(block as any).marginBottom || 0}
                    onChange={(e) => updateBlock(block.id, { marginBottom: parseInt(e.target.value) || 0 }, columnKey)}
                    className="mt-1 h-8"
                  />
                </div>
              </div>

              {block.type === "text" && (
                <div>
                  <Label className="text-xs">Largura Máxima</Label>
                  <Input
                    value={(block as any).maxWidth || ""}
                    onChange={(e) => updateBlock(block.id, { maxWidth: e.target.value }, columnKey)}
                    placeholder="Ex: 28rem, 400px, 50%"
                    className="mt-1 h-8"
                  />
                </div>
              )}
            </>
          )}

          {block.type === "image" && (
            <>
              <div>
                <Label className="text-xs">Imagem</Label>
                {(block as any).src ? (
                  <div className="relative mt-1 rounded-lg overflow-hidden group">
                    <img src={(block as any).src} alt={(block as any).alt || ""} className="w-full h-32 object-cover" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, block.id, columnKey);
                      }} />
                    </label>
                  </div>
                ) : (
                  <label className="block mt-1 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground mt-1">Clique para enviar</span>
                    <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, block.id, columnKey);
                    }} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Largura</Label>
                  <Input
                    value={(block as any).width || "100%"}
                    onChange={(e) => updateBlock(block.id, { width: e.target.value }, columnKey)}
                    placeholder="Ex: 800px, 100%"
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Altura</Label>
                  <Input
                    value={(block as any).height || "auto"}
                    onChange={(e) => updateBlock(block.id, { height: e.target.value }, columnKey)}
                    placeholder="Ex: 400px, auto"
                    className="mt-1 h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Alinhamento</Label>
                <Select value={(block as any).alignment || "left"} onValueChange={(v) => updateBlock(block.id, { alignment: v as "left" | "center" | "right" }, columnKey)}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Margem Negativa Topo (px)</Label>
                  <Input
                    type="number"
                    value={(block as any).negativeMarginTop || 0}
                    onChange={(e) => updateBlock(block.id, { negativeMarginTop: parseInt(e.target.value) || 0 }, columnKey)}
                    className="mt-1 h-8"
                  />
                  <p className="text-[10px] text-muted-foreground">Para sobrepor seção anterior</p>
                </div>
                <div>
                  <Label className="text-xs">Margem Negativa Esq. (px)</Label>
                  <Input
                    type="number"
                    value={(block as any).negativeMarginLeft || 0}
                    onChange={(e) => updateBlock(block.id, { negativeMarginLeft: parseInt(e.target.value) || 0 }, columnKey)}
                    className="mt-1 h-8"
                  />
                </div>
              </div>
            </>
          )}

          {block.type === "spacer" && (
            <div>
              <Label className="text-xs">Altura (px)</Label>
              <Input
                type="number"
                value={(block as any).height || 32}
                onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) || 32 }, columnKey)}
                className="mt-1 h-8"
              />
            </div>
          )}

          {block.type === "button" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Texto do Botão</Label>
                  <Input
                    value={(block as any).label || ""}
                    onChange={(e) => updateBlock(block.id, { label: e.target.value }, columnKey)}
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link</Label>
                  <Input
                    value={(block as any).link || "#"}
                    onChange={(e) => updateBlock(block.id, { link: e.target.value }, columnKey)}
                    className="mt-1 h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Variante</Label>
                  <Select value={(block as any).variant || "primary"} onValueChange={(v) => updateBlock(block.id, { variant: v as "primary" | "secondary" | "outline" | "ghost" }, columnKey)}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primário</SelectItem>
                      <SelectItem value="secondary">Secundário</SelectItem>
                      <SelectItem value="outline">Contorno</SelectItem>
                      <SelectItem value="ghost">Fantasma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Alinhamento</Label>
                  <Select value={(block as any).alignment || "left"} onValueChange={(v) => updateBlock(block.id, { alignment: v as "left" | "center" | "right" }, columnKey)}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderColumnEditor = (columnKey: "leftColumn" | "rightColumn" | "singleColumn", label: string) => {
    const column = config[columnKey] || { blocks: [], alignment: "start" };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addBlock("heading", columnKey)}>
              <Type className="w-3 h-3 mr-1" /> Título
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addBlock("text", columnKey)}>
              <Type className="w-3 h-3 mr-1" /> Texto
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addBlock("image", columnKey)}>
              <ImageIcon className="w-3 h-3 mr-1" /> Imagem
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label className="text-xs">Padding Esquerda (px)</Label>
            <Input
              type="number"
              value={column.paddingLeft || 0}
              onChange={(e) => setConfig({
                ...config,
                [columnKey]: { ...column, paddingLeft: parseInt(e.target.value) || 0 }
              })}
              className="mt-1 h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Padding Direita (px)</Label>
            <Input
              type="number"
              value={column.paddingRight || 0}
              onChange={(e) => setConfig({
                ...config,
                [columnKey]: { ...column, paddingRight: parseInt(e.target.value) || 0 }
              })}
              className="mt-1 h-8"
            />
          </div>
        </div>

        {column.blocks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-sm">Nenhum bloco adicionado</p>
            <p className="text-xs">Clique nos botões acima para adicionar conteúdo</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-1">
            {column.blocks.map((block: ContentBlock, index: number) => 
              renderBlockEditor(block, columnKey, index, column.blocks.length)
            )}
          </Accordion>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-display text-lg text-card-foreground">Editar Seção</h3>
          <p className="text-xs text-muted-foreground">Configuração avançada</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <Label>Nome da Seção</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>

          <div className="flex items-center justify-between">
            <Label>Visível</Label>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </div>

        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4 mt-4">
            {/* Layout Settings */}
            <div>
              <Label>Tipo de Layout</Label>
              <Select value={config.layoutType} onValueChange={(v) => setConfig({ ...config, layoutType: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Coluna Única</SelectItem>
                  <SelectItem value="two-column">Duas Colunas</SelectItem>
                  <SelectItem value="left-wide">Esquerda Maior</SelectItem>
                  <SelectItem value="right-wide">Direita Maior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={config.backgroundColor || "#ffffff"}
                  onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={config.backgroundColor || "#ffffff"}
                  onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Padding Topo (px)</Label>
                <Input
                  type="number"
                  value={config.paddingTop || 80}
                  onChange={(e) => setConfig({ ...config, paddingTop: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Padding Base (px)</Label>
                <Input
                  type="number"
                  value={config.paddingBottom || 80}
                  onChange={(e) => setConfig({ ...config, paddingBottom: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Margem Topo (px)</Label>
                <Input
                  type="number"
                  value={config.marginTop || 0}
                  onChange={(e) => setConfig({ ...config, marginTop: parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground">Use negativo para sobrepor</p>
              </div>
              <div>
                <Label>Margem Base (px)</Label>
                <Input
                  type="number"
                  value={config.marginBottom || 0}
                  onChange={(e) => setConfig({ ...config, marginBottom: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {config.layoutType !== "single" && (
              <div>
                <Label>Espaço entre Colunas (px)</Label>
                <Input
                  type="number"
                  value={config.columnGap || 64}
                  onChange={(e) => setConfig({ ...config, columnGap: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            {config.layoutType === "single" ? (
              renderColumnEditor("singleColumn", "Conteúdo")
            ) : (
              <Tabs value={activeColumn} onValueChange={(v) => setActiveColumn(v as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="left">Coluna Esquerda</TabsTrigger>
                  <TabsTrigger value="right">Coluna Direita</TabsTrigger>
                </TabsList>
                <TabsContent value="left">
                  {renderColumnEditor("leftColumn", "Coluna Esquerda")}
                </TabsContent>
                <TabsContent value="right">
                  {renderColumnEditor("rightColumn", "Coluna Direita")}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button onClick={handleSave} className="w-full gap-2" disabled={updateModule.isPending || updateConfig.isPending}>
          {(updateModule.isPending || updateConfig.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default AdvancedSectionEditor;
