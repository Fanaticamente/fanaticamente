// ModuleEditor.tsx - v2.1.0 - 2026-02-02
// Features: Overlay toggle, spacing controls, Montserrat Arabic & Poppins fonts
import { useState, useEffect } from "react";
import { X, Save, Upload, Plus, Trash2, Link, ImageIcon, Type, Palette, Heart, ArrowUp, ArrowDown } from "lucide-react";
import { AppModule, useUpdateModule, useUpdateModuleConfig } from "@/hooks/useAppModules";
import { useFeaturedHealthNews } from "@/hooks/useHealthNews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import ClubBadgeToggles from "./ClubBadgeToggles";
interface ModuleEditorProps {
  module: AppModule | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface SlideConfig {
  image: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFont?: string;
  subtitleFont?: string;
  showOverlay?: boolean;
  titleSubtitleGap?: number;
  titleLineHeight?: number;
  subtitleLineHeight?: number;
  // Auto-managed slide bound to a featured health news item
  healthNewsId?: string;
  _titleOverridden?: boolean;
  _subtitleOverridden?: boolean;
}

// Dimensões reais dos módulos baseadas no layout do app (2x para retina)
const MODULE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  hero_carousel: { width: 750, height: 960, label: "Carrossel Principal (2x)" },
  tunnel_access: { width: 686, height: 320, label: "Túnel de Acesso (2x)" },
  ticket_card: { width: 686, height: 400, label: "Ingresso Consciência (2x)" },
  quiz_card: { width: 686, height: 192, label: "Quiz Emocional (2x)" },
  fanaticlass_card: { width: 686, height: 192, label: "FanatiClass (2x)" },
  radio_card: { width: 686, height: 192, label: "Rádio Fanática (2x)" },
};

const FONT_OPTIONS = [
  { value: "inherit", label: "Padrão (Display)" },
  { value: "font-sans", label: "Sans-serif" },
  { value: "font-serif", label: "Serif" },
  { value: "font-mono", label: "Monospace" },
  { value: "font-montserrat", label: "Montserrat Arabic" },
  { value: "font-poppins", label: "Poppins" },
];

const COLOR_PRESETS = [
  { value: "#FFFFFF", label: "Branco" },
  { value: "#F5C542", label: "Amarelo (Primary)" },
  { value: "#000000", label: "Preto" },
  { value: "#FF6B6B", label: "Vermelho" },
  { value: "#4ECDC4", label: "Verde" },
  { value: "#45B7D1", label: "Azul" },
];

const ModuleEditor = ({ module, onClose, onSaved }: ModuleEditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  
  const updateModule = useUpdateModule();
  const updateConfig = useUpdateModuleConfig();
  const { data: featuredHealth } = useFeaturedHealthNews();

  const dimensions = module ? MODULE_DIMENSIONS[module.module_id] : null;

  useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description || "");
      setIsVisible(module.is_visible);
      setConfig(typeof module.config === 'object' && module.config !== null ? module.config as Record<string, unknown> : {});
    }
  }, [module]);

  // Auto-sync: ensure each featured health news has a slide in the carousel.
  // - Adds a new auto-slide for newly featured news (with current default styling).
  // - Refreshes image/title/subtitle defaults when the news content changes (only if not overridden).
  // - Removes auto-slides whose news is no longer featured/published.
  useEffect(() => {
    if (!module || module.module_id !== "hero_carousel") return;
    if (!featuredHealth) return;

    const currentSlides = (config.slides || []) as SlideConfig[];
    const featuredIds = new Set(featuredHealth.filter(n => !!n.cover_image_url).map(n => n.id));

    // Filter out auto-slides whose news is no longer featured
    const kept = currentSlides.filter(s => !s.healthNewsId || featuredIds.has(s.healthNewsId));

    // Update existing auto-slides with latest news data (without overriding manual edits flagged via _overrides)
    const updated = kept.map(s => {
      if (!s.healthNewsId) return s;
      const news = featuredHealth.find(n => n.id === s.healthNewsId);
      if (!news) return s;
      return {
        ...s,
        // Always sync image to the cover image (image is owned by the news article)
        image: news.cover_image_url || s.image,
        // Sync defaults only if the user hasn't customized them
        title: s._titleOverridden ? s.title : (news.title || s.title),
        subtitle: s._subtitleOverridden ? s.subtitle : (news.subtitle ?? news.excerpt ?? ""),
      } as SlideConfig & { _titleOverridden?: boolean; _subtitleOverridden?: boolean };
    });

    // Add new auto-slides for newly featured news
    const existingIds = new Set(updated.filter(s => s.healthNewsId).map(s => s.healthNewsId));
    const additions: SlideConfig[] = featuredHealth
      .filter(n => !!n.cover_image_url && !existingIds.has(n.id))
      .map(n => ({
        image: n.cover_image_url as string,
        title: n.title,
        subtitle: n.subtitle ?? n.excerpt ?? "",
        titleColor: "#FFFFFF",
        subtitleColor: "#FFFFFF",
        titleFont: "font-sans",
        subtitleFont: "font-sans",
        showOverlay: true,
        titleSubtitleGap: 8,
        titleLineHeight: 1.1,
        subtitleLineHeight: 1.4,
        healthNewsId: n.id,
      }));

    const next = [...updated, ...additions];

    // Only update state if something actually changed (avoid render loops)
    if (JSON.stringify(next) !== JSON.stringify(currentSlides)) {
      setConfig((prev) => ({ ...prev, slides: next }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id, featuredHealth]);

  if (!module) {
    return (
      <div className="h-full flex items-center justify-center bg-card border-l border-border">
        <div className="text-center p-6">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Selecione um módulo para editar
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      // Use mutateAsync to know when the save actually finished.
      await Promise.all([
        updateModule.mutateAsync({
          id: module.id,
          updates: {
            name,
            description: description || null,
            is_visible: isVisible,
          },
        }),
        updateConfig.mutateAsync({
          id: module.id,
          config: config as Json,
        }),
      ]);

      onSaved?.();
    } catch {
      // Errors are already toasted by the mutations.
    }
  };

  const handleImageUpload = async (file: File, configKey: string, index?: number) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${module.module_id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("module-images")
        .getPublicUrl(fileName);
      
      if (typeof index === "number" && configKey === "slides") {
        const slides = (config.slides || []) as SlideConfig[];
        slides[index] = { ...slides[index], image: publicUrl };
        setConfig({ ...config, slides });
      } else {
        setConfig({ ...config, [configKey]: publicUrl });
      }
      
      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const addSlide = () => {
    const slides = (config.slides || []) as SlideConfig[];
    setConfig({
      ...config,
      slides: [...slides, { 
        image: "", 
        title: "", 
        subtitle: "",
        titleColor: "#FFFFFF",
        subtitleColor: "#FFFFFF",
        titleFont: "inherit",
        subtitleFont: "inherit",
        showOverlay: true,
        titleSubtitleGap: 8,
        titleLineHeight: 1.1,
        subtitleLineHeight: 1.4
      }],
    });
  };

  const removeSlide = (index: number) => {
    const slides = (config.slides || []) as SlideConfig[];
    slides.splice(index, 1);
    setConfig({ ...config, slides: [...slides] });
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const slides = [...((config.slides || []) as SlideConfig[])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
    setConfig({ ...config, slides });
  };

  const updateSlide = (index: number, field: string, value: string | number | boolean) => {
    const slides = (config.slides || []) as SlideConfig[];
    // Parse numeric and boolean values
    let parsedValue: string | number | boolean = value;
    if (field === "showOverlay") {
      parsedValue = value === "true" || value === true;
    } else if (["titleSubtitleGap", "titleLineHeight", "subtitleLineHeight"].includes(field)) {
      parsedValue = typeof value === "string" ? parseFloat(value) : value;
    }
    const updated: Record<string, unknown> = { ...slides[index], [field]: parsedValue };
    // Mark overrides for auto-managed slides so they don't get reset by the news sync
    if (slides[index]?.healthNewsId) {
      if (field === "title") updated._titleOverridden = true;
      if (field === "subtitle") updated._subtitleOverridden = true;
    }
    slides[index] = updated as unknown as SlideConfig;
    setConfig({ ...config, slides: [...slides] });
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div>
          <h3 className="font-display text-lg text-card-foreground">{module.name}</h3>
          <p className="text-xs text-muted-foreground">{module.module_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={updateModule.isPending || updateConfig.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full grid grid-cols-2 m-4 mb-0" style={{ width: "calc(100% - 32px)" }}>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="p-4 space-y-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Título do módulo (uso interno)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas para organização no gerenciador
                </p>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visível no app</Label>
                <Switch
                  id="visible"
                  checked={isVisible}
                  onCheckedChange={setIsVisible}
                />
              </div>
            </div>
            
            {/* Module-specific config */}
            {module.module_type === "carousel" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Slides do carrossel</Label>
                  <Button size="sm" variant="outline" onClick={addSlide}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {((config.slides || []) as SlideConfig[]).map((slide, index) => (
                  <div key={index} className="p-4 bg-muted rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Slide {index + 1}</span>
                        {slide.healthNewsId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide">
                            <Heart className="w-3 h-3 fill-current" />
                            Matéria destacada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveSlide(index, -1)}
                          disabled={index === 0}
                          title="Mover para cima"
                          className="h-7 w-7 p-0"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveSlide(index, 1)}
                          disabled={index === ((config.slides || []) as SlideConfig[]).length - 1}
                          title="Mover para baixo"
                          className="h-7 w-7 p-0"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        {!slide.healthNewsId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSlide(index)}
                            className="text-destructive h-7 w-7 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic ml-1">
                            Auto
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        <span>Imagem</span>
                        {dimensions && (
                          <span className="text-xs text-primary font-normal">
                            {dimensions.width} x {dimensions.height} px
                          </span>
                        )}
                      </Label>
                      <div className="mt-1 flex gap-2">
                        {slide.image ? (
                          <div className="relative w-full h-24 rounded-lg overflow-hidden">
                            <img
                              src={slide.image}
                              alt={`Slide ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <Upload className="w-6 h-6 text-white" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, "slides", index);
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Clique para enviar</span>
                            {dimensions && (
                              <span className="text-xs text-primary mt-1">
                                {dimensions.width} x {dimensions.height} px
                              </span>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, "slides", index);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {/* Title with font and color options */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Título
                      </Label>
                      <Input
                        value={slide.title || ""}
                        onChange={(e) => updateSlide(index, "title", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Fonte</Label>
                          <Select 
                            value={slide.titleFont || "inherit"}
                            onValueChange={(value) => updateSlide(index, "titleFont", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            Cor
                          </Label>
                          <div className="flex gap-1 mt-1">
                            <Input
                              type="color"
                              value={slide.titleColor || "#FFFFFF"}
                              onChange={(e) => updateSlide(index, "titleColor", e.target.value)}
                              className="w-10 h-9 p-1 cursor-pointer"
                            />
                            <Select 
                              value={slide.titleColor || "#FFFFFF"}
                              onValueChange={(value) => updateSlide(index, "titleColor", value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLOR_PRESETS.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded border border-border" 
                                        style={{ backgroundColor: color.value }}
                                      />
                                      {color.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Subtitle with font and color options */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Subtítulo
                      </Label>
                      <Input
                        value={slide.subtitle || ""}
                        onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Fonte</Label>
                          <Select 
                            value={slide.subtitleFont || "inherit"}
                            onValueChange={(value) => updateSlide(index, "subtitleFont", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            Cor
                          </Label>
                          <div className="flex gap-1 mt-1">
                            <Input
                              type="color"
                              value={slide.subtitleColor || "#FFFFFF"}
                              onChange={(e) => updateSlide(index, "subtitleColor", e.target.value)}
                              className="w-10 h-9 p-1 cursor-pointer"
                            />
                            <Select 
                              value={slide.subtitleColor || "#FFFFFF"}
                              onValueChange={(value) => updateSlide(index, "subtitleColor", value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLOR_PRESETS.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded border border-border" 
                                        style={{ backgroundColor: color.value }}
                                      />
                                      {color.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Overlay Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <Label className="text-sm">Overlay (degradê)</Label>
                        <p className="text-xs text-muted-foreground">Escurece a imagem para melhor leitura</p>
                      </div>
                      <Switch
                        checked={slide.showOverlay !== false}
                        onCheckedChange={(checked) => updateSlide(index, "showOverlay", checked ? "true" : "false")}
                      />
                    </div>
                    
                    {/* Spacing Controls */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <Label className="text-sm font-medium">Espaçamento e Altura de Linha</Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Espaço Título/Subtítulo</Label>
                          <Select 
                            value={String(slide.titleSubtitleGap ?? 8)}
                            onValueChange={(value) => updateSlide(index, "titleSubtitleGap", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Nenhum</SelectItem>
                              <SelectItem value="4">Pequeno (4px)</SelectItem>
                              <SelectItem value="8">Médio (8px)</SelectItem>
                              <SelectItem value="12">Grande (12px)</SelectItem>
                              <SelectItem value="16">Extra (16px)</SelectItem>
                              <SelectItem value="24">Máximo (24px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Altura Linha Título</Label>
                          <Select 
                            value={String(slide.titleLineHeight ?? 1.1)}
                            onValueChange={(value) => updateSlide(index, "titleLineHeight", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Compacto (1)</SelectItem>
                              <SelectItem value="1.1">Normal (1.1)</SelectItem>
                              <SelectItem value="1.25">Médio (1.25)</SelectItem>
                              <SelectItem value="1.4">Espaçado (1.4)</SelectItem>
                              <SelectItem value="1.6">Largo (1.6)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Altura Linha Subtítulo</Label>
                          <Select 
                            value={String(slide.subtitleLineHeight ?? 1.4)}
                            onValueChange={(value) => updateSlide(index, "subtitleLineHeight", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Compacto (1)</SelectItem>
                              <SelectItem value="1.2">Normal (1.2)</SelectItem>
                              <SelectItem value="1.4">Médio (1.4)</SelectItem>
                              <SelectItem value="1.6">Espaçado (1.6)</SelectItem>
                              <SelectItem value="1.8">Largo (1.8)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {module.module_type === "card" && (
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Imagem de fundo</span>
                    {dimensions && (
                      <span className="text-xs text-primary font-normal">
                        {dimensions.width} x {dimensions.height} px
                      </span>
                    )}
                  </Label>
                  <div className="mt-2">
                    {config.image ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <img
                          src={config.image as string}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, "image");
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        {dimensions && (
                          <span className="text-xs text-primary mt-1">
                            {dimensions.width} x {dimensions.height} px
                          </span>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "image");
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Título do card (uso interno)</Label>
                  <Input
                    value={(config.title as string) || ""}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas para organização no gerenciador
                  </p>
                </div>
                
                <div>
                  <Label>Link de destino</Label>
                  <div className="flex gap-2 mt-1">
                    <Link className="w-4 h-4 text-muted-foreground mt-3" />
                    <Input
                      value={(config.link as string) || ""}
                      onChange={(e) => setConfig({ ...config, link: e.target.value })}
                      placeholder="/pagina"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {module.module_type === "text" && (
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={(config.title as string) || ""}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Textarea
                    value={(config.subtitle as string) || ""}
                    onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {module.module_type === "list" && (
              <div className="space-y-4">
                <div>
                  <Label>Título da seção</Label>
                  <Input
                    value={(config.title as string) || ""}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Itens</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const items = [...((config.items as Record<string, string>[]) || [])];
                      items.push(
                        module.module_id === "home_shortcuts"
                          ? { icon: "Home", label: "Novo item", path: "/" }
                          : { kicker: "", title: "Novo item", subtitle: "", path: "/" }
                      );
                      setConfig({ ...config, items });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>

                {((config.items as Record<string, string>[]) || []).map((item, index) => {
                  const items = (config.items as Record<string, string>[]) || [];
                  const setItem = (field: string, value: string) => {
                    const next = [...items];
                    next[index] = { ...next[index], [field]: value };
                    setConfig({ ...config, items: next });
                  };
                  const move = (dir: -1 | 1) => {
                    const target = index + dir;
                    if (target < 0 || target >= items.length) return;
                    const next = [...items];
                    [next[index], next[target]] = [next[target], next[index]];
                    setConfig({ ...config, items: next });
                  };
                  return (
                    <div key={index} className="p-3 border border-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Item {index + 1}</span>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(-1)}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(1)}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => setConfig({ ...config, items: items.filter((_, i) => i !== index) })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {module.module_id === "home_shortcuts" ? (
                        <>
                          <Select value={item.icon || "Home"} onValueChange={(v) => setItem("icon", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MENU_ICON_NAMES.map((n) => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.label || ""}
                            onChange={(e) => setItem("label", e.target.value)}
                            placeholder="Rótulo"
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            value={item.kicker || ""}
                            onChange={(e) => setItem("kicker", e.target.value)}
                            placeholder="Chapéu (ex: Sugestão para você)"
                          />
                          <Input
                            value={item.title || ""}
                            onChange={(e) => setItem("title", e.target.value)}
                            placeholder="Título"
                          />
                          <Input
                            value={item.subtitle || ""}
                            onChange={(e) => setItem("subtitle", e.target.value)}
                            placeholder="Subtítulo"
                          />
                          <Input
                            value={item.image || ""}
                            onChange={(e) => setItem("image", e.target.value)}
                            placeholder="URL do ícone/imagem (opcional)"
                          />
                        </>
                      )}

                      <Input
                        value={item.path || ""}
                        onChange={(e) => setItem("path", e.target.value)}
                        placeholder="/destino"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {module.module_type === "page" && (
              <div className="space-y-4">
                <div>
                  <Label>Título da página</Label>
                  <Input
                    value={(config.title as string) || ""}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Caminho (URL)</Label>
                  <div className="flex gap-2 mt-1">
                    <Link className="w-4 h-4 text-muted-foreground mt-3" />
                    <Input
                      value={(config.path as string) || ""}
                      onChange={(e) => setConfig({ ...config, path: e.target.value })}
                      placeholder="/pagina"
                    />
                  </div>
                </div>

                {(module.module_id === "therapists_page" ||
                  module.module_id === "ranking_page" ||
                  module.module_id === "football_page" ||
                  module.module_id === "sidebar_user_club") && (
                  <ClubBadgeToggles
                    showBadges={config.show_badges !== false}
                    onShowBadgesChange={(val) => setConfig((prev) => ({ ...prev, show_badges: val }))}
                    hiddenBadges={(config.hidden_badges as string[]) || []}
                    onHiddenBadgesChange={(badges) => setConfig((prev) => ({ ...prev, hidden_badges: badges }))}
                    displayMode={(config.club_display_mode as "badge" | "flag") || "badge"}
                    onDisplayModeChange={(mode) => setConfig((prev) => ({ ...prev, club_display_mode: mode }))}
                  />
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="layout" className="p-4 space-y-4">
            {dimensions && (
              <div className="p-4 bg-muted rounded-xl">
                <Label className="text-sm font-medium">Dimensões do módulo</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Tamanho recomendado para imagens neste módulo
                </p>
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">{dimensions.width}</span>
                    <span className="text-xs text-muted-foreground block">largura (px)</span>
                  </div>
                  <div className="text-muted-foreground self-center">×</div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">{dimensions.height}</span>
                    <span className="text-xs text-muted-foreground block">altura (px)</span>
                  </div>
                </div>
              </div>
            )}
            <div className="text-center py-4 text-muted-foreground">
              <p>Mais opções de layout em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Button className="w-full" onClick={handleSave} disabled={updateModule.isPending || updateConfig.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default ModuleEditor;
