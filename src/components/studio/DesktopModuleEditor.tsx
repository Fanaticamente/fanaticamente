import { useState, useEffect } from "react";
import { X, Save, Upload, Plus, Trash2, Type, Palette, Image as ImageIcon, Link, GripVertical, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { AppModule, useUpdateModule, useUpdateModuleConfig } from "@/hooks/useAppModules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface DesktopModuleEditorProps {
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
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface CuriosityItem {
  number: string;
  description: string;
}

interface TestimonialItem {
  name: string;
  club: string;
  text: string;
  avatar?: string;
}

interface FooterLink {
  label: string;
  path: string;
}

const COLOR_PRESETS = [
  { value: "#FFFFFF", label: "Branco" },
  { value: "#d1d5db", label: "Cinza claro" },
  { value: "#10b981", label: "Verde (Accent)" },
  { value: "#F5C542", label: "Amarelo (Primary)" },
  { value: "#000000", label: "Preto" },
];

const ICON_OPTIONS = [
  { value: "therapist", label: "Terapeutas" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "knowledge", label: "Conhecimento" },
  { value: "jersey", label: "Camisas" },
];

const DesktopModuleEditor = ({ module, onClose, onSaved }: DesktopModuleEditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  
  // AI Image Generation State
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiTargetSlideIndex, setAiTargetSlideIndex] = useState<number | null>(null);
  
  const updateModule = useUpdateModule();
  const updateConfig = useUpdateModuleConfig();

  useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description || "");
      setIsVisible(module.is_visible);
      setConfig(typeof module.config === 'object' && module.config !== null ? module.config as Record<string, unknown> : {});
    }
  }, [module]);

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
      // Errors handled by mutations
    }
  };

  const handleImageUpload = async (file: File, configKey: string, index?: number, subKey?: string) => {
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
      
      if (typeof index === "number" && subKey) {
        const items = (config[configKey] || []) as Record<string, unknown>[];
        items[index] = { ...items[index], [subKey]: publicUrl };
        setConfig({ ...config, [configKey]: items });
      } else if (typeof index === "number") {
        const items = (config[configKey] || []) as Record<string, unknown>[];
        items[index] = { ...items[index], image: publicUrl };
        setConfig({ ...config, [configKey]: items });
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

  // AI Image Generation
  const openAiDialog = (slideIndex: number) => {
    setAiTargetSlideIndex(slideIndex);
    setAiPrompt("");
    setAiGeneratedImage(null);
    setAiDialogOpen(true);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }
    
    setAiGenerating(true);
    setAiGeneratedImage(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-carousel-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: aiPrompt }),
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao gerar imagem");
      }
      
      setAiGeneratedImage(data.imageUrl);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar imagem");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiImage = async () => {
    if (!aiGeneratedImage || aiTargetSlideIndex === null) return;
    
    try {
      // Convert base64 to blob and upload to storage
      const base64Data = aiGeneratedImage.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      
      const fileName = `desktop-ai-${module?.module_id}-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("module-images")
        .getPublicUrl(fileName);
      
      // Update the slide with the new image
      const slides = (config.slides || []) as SlideConfig[];
      slides[aiTargetSlideIndex] = { ...slides[aiTargetSlideIndex], image: publicUrl };
      setConfig({ ...config, slides: [...slides] });
      
      toast.success("Imagem aplicada ao slide!");
      setAiDialogOpen(false);
      setAiGeneratedImage(null);
      setAiPrompt("");
    } catch (error) {
      console.error("Error applying AI image:", error);
      toast.error("Erro ao aplicar imagem");
    }
  };

  // Carousel slide management
  const addSlide = () => {
    const slides = (config.slides || []) as SlideConfig[];
    setConfig({
      ...config,
      slides: [...slides, { 
        image: "", 
        title: "", 
        subtitle: "",
        titleColor: "#FFFFFF",
        subtitleColor: "#d1d5db"
      }],
    });
  };

  const removeSlide = (index: number) => {
    const slides = (config.slides || []) as SlideConfig[];
    slides.splice(index, 1);
    setConfig({ ...config, slides: [...slides] });
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const slides = (config.slides || []) as SlideConfig[];
    slides[index] = { ...slides[index], [field]: value };
    setConfig({ ...config, slides: [...slides] });
  };

  // Feature items management
  const addFeatureItem = () => {
    const items = (config.items || []) as FeatureItem[];
    setConfig({
      ...config,
      items: [...items, { icon: "therapist", title: "", description: "" }],
    });
  };

  const removeFeatureItem = (index: number) => {
    const items = (config.items || []) as FeatureItem[];
    items.splice(index, 1);
    setConfig({ ...config, items: [...items] });
  };

  const updateFeatureItem = (index: number, field: string, value: string) => {
    const items = (config.items || []) as FeatureItem[];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, items: [...items] });
  };

  // Curiosity items management
  const addCuriosityItem = () => {
    const items = (config.items || []) as CuriosityItem[];
    setConfig({
      ...config,
      items: [...items, { number: "", description: "" }],
    });
  };

  const removeCuriosityItem = (index: number) => {
    const items = (config.items || []) as CuriosityItem[];
    items.splice(index, 1);
    setConfig({ ...config, items: [...items] });
  };

  const updateCuriosityItem = (index: number, field: string, value: string) => {
    const items = (config.items || []) as CuriosityItem[];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, items: [...items] });
  };

  // Testimonial management
  const addTestimonial = () => {
    const testimonials = (config.testimonials || []) as TestimonialItem[];
    setConfig({
      ...config,
      testimonials: [...testimonials, { name: "", club: "", text: "", avatar: "" }],
    });
  };

  const removeTestimonial = (index: number) => {
    const testimonials = (config.testimonials || []) as TestimonialItem[];
    testimonials.splice(index, 1);
    setConfig({ ...config, testimonials: [...testimonials] });
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    const testimonials = (config.testimonials || []) as TestimonialItem[];
    testimonials[index] = { ...testimonials[index], [field]: value };
    setConfig({ ...config, testimonials: [...testimonials] });
  };

  // Footer links management
  const addFooterLink = () => {
    const links = (config.links || []) as FooterLink[];
    setConfig({
      ...config,
      links: [...links, { label: "", path: "" }],
    });
  };

  const removeFooterLink = (index: number) => {
    const links = (config.links || []) as FooterLink[];
    links.splice(index, 1);
    setConfig({ ...config, links: [...links] });
  };

  const updateFooterLink = (index: number, field: string, value: string) => {
    const links = (config.links || []) as FooterLink[];
    links[index] = { ...links[index], [field]: value };
    setConfig({ ...config, links: [...links] });
  };

  const renderCarouselEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Slides do carrossel</Label>
        <Button size="sm" variant="outline" onClick={addSlide}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Slide
        </Button>
      </div>
      
      {((config.slides || []) as SlideConfig[]).map((slide, index) => (
        <div key={index} className="p-4 bg-muted rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <span className="text-sm font-medium">Slide {index + 1}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeSlide(index)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Image */}
          <div>
            <Label className="flex items-center justify-between">
              <span>Imagem de fundo</span>
              <span className="text-xs text-primary font-normal">1920 x 1080 px</span>
            </Label>
            <div className="mt-1">
              {slide.image ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                  <img src={slide.image} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="p-2 bg-white/20 rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
                      <Upload className="w-5 h-5 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, "slides", index);
                      }} />
                    </label>
                    <button 
                      onClick={() => openAiDialog(index)}
                      className="p-2 bg-primary/80 rounded-lg cursor-pointer hover:bg-primary transition-colors"
                    >
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "slides", index);
                    }} />
                  </label>
                  <button 
                    onClick={() => openAiDialog(index)}
                    className="flex-1 h-32 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Sparkles className="w-6 h-6 text-primary mb-1" />
                    <span className="text-xs text-primary">Gerar com IA</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Título
            </Label>
            <Input value={slide.title || ""} onChange={(e) => updateSlide(index, "title", e.target.value)} />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Cor do título
                </Label>
                <div className="flex gap-1 mt-1">
                  <Input type="color" value={slide.titleColor || "#FFFFFF"} onChange={(e) => updateSlide(index, "titleColor", e.target.value)} className="w-10 h-9 p-1 cursor-pointer" />
                  <Select value={slide.titleColor || "#FFFFFF"} onValueChange={(value) => updateSlide(index, "titleColor", value)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: color.value }} />
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
          
          {/* Subtitle */}
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea value={slide.subtitle || ""} onChange={(e) => updateSlide(index, "subtitle", e.target.value)} rows={2} />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Cor do subtítulo
                </Label>
                <div className="flex gap-1 mt-1">
                  <Input type="color" value={slide.subtitleColor || "#d1d5db"} onChange={(e) => updateSlide(index, "subtitleColor", e.target.value)} className="w-10 h-9 p-1 cursor-pointer" />
                  <Select value={slide.subtitleColor || "#d1d5db"} onValueChange={(value) => updateSlide(index, "subtitleColor", value)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: color.value }} />
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
        </div>
      ))}
    </div>
  );

  const renderFeaturesEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Título da seção</Label>
        <Input value={(config.title as string) || ""} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea value={(config.subtitle as string) || ""} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} className="mt-1" rows={2} />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Cards de diferenciais</Label>
        <Button size="sm" variant="outline" onClick={addFeatureItem}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Card
        </Button>
      </div>
      
      {((config.items || []) as FeatureItem[]).map((item, index) => (
        <div key={index} className="p-4 bg-muted rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <span className="text-sm font-medium">Card {index + 1}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeFeatureItem(index)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div>
            <Label>Ícone</Label>
            <Select value={item.icon} onValueChange={(value) => updateFeatureItem(index, "icon", value)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Título</Label>
            <Input value={item.title || ""} onChange={(e) => updateFeatureItem(index, "title", e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Descrição</Label>
            <Textarea value={item.description || ""} onChange={(e) => updateFeatureItem(index, "description", e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderCuriositiesEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Título da seção</Label>
        <Input value={(config.title as string) || ""} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-1" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Estatísticas</Label>
        <Button size="sm" variant="outline" onClick={addCuriosityItem}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
      
      {((config.items || []) as CuriosityItem[]).map((item, index) => (
        <div key={index} className="p-4 bg-muted rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estatística {index + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => removeCuriosityItem(index)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div>
            <Label>Número/Porcentagem</Label>
            <Input value={item.number || ""} onChange={(e) => updateCuriosityItem(index, "number", e.target.value)} className="mt-1" placeholder="Ex: 65%" />
          </div>
          
          <div>
            <Label>Descrição</Label>
            <Input value={item.description || ""} onChange={(e) => updateCuriosityItem(index, "description", e.target.value)} className="mt-1" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAboutEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={(config.title as string) || ""} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea value={(config.subtitle as string) || ""} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Descrição completa</Label>
        <Textarea value={(config.description as string) || ""} onChange={(e) => setConfig({ ...config, description: e.target.value })} className="mt-1" rows={4} />
      </div>
      <div>
        <Label>Imagem (Mac mockup)</Label>
        <div className="mt-1">
          {config.image ? (
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <img src={config.image as string} alt="About" className="w-full h-full object-cover" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "image");
                }} />
              </label>
            </div>
          ) : (
            <label className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Clique para enviar</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "image");
              }} />
            </label>
          )}
        </div>
      </div>
    </div>
  );

  const renderTestimonialsEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Título da seção</Label>
        <Input value={(config.title as string) || ""} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-1" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Depoimentos</Label>
        <Button size="sm" variant="outline" onClick={addTestimonial}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
      
      {((config.testimonials || []) as TestimonialItem[]).map((item, index) => (
        <div key={index} className="p-4 bg-muted rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Depoimento {index + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => removeTestimonial(index)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={item.name || ""} onChange={(e) => updateTestimonial(index, "name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Clube</Label>
              <Input value={item.club || ""} onChange={(e) => updateTestimonial(index, "club", e.target.value)} className="mt-1" />
            </div>
          </div>
          
          <div>
            <Label>Texto do depoimento</Label>
            <Textarea value={item.text || ""} onChange={(e) => updateTestimonial(index, "text", e.target.value)} className="mt-1" rows={3} />
          </div>
          
          <div>
            <Label>Avatar (opcional)</Label>
            <div className="mt-1">
              {item.avatar ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "testimonials", index, "avatar");
                    }} />
                  </label>
                </div>
              ) : (
                <label className="w-16 h-16 border-2 border-dashed border-border rounded-full flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "testimonials", index, "avatar");
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFormEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={(config.title as string) || ""} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={(config.subtitle as string) || ""} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={(config.description as string) || ""} onChange={(e) => setConfig({ ...config, description: e.target.value })} className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Texto do botão</Label>
        <Input value={(config.buttonText as string) || ""} onChange={(e) => setConfig({ ...config, buttonText: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label className="flex items-center gap-2">
          <Link className="w-4 h-4" />
          Link do botão
        </Label>
        <Input value={(config.buttonLink as string) || ""} onChange={(e) => setConfig({ ...config, buttonLink: e.target.value })} className="mt-1" placeholder="/auth?tab=profissional" />
      </div>
    </div>
  );

  const renderFooterEditor = () => (
    <div className="space-y-4">
      <div>
        <Label>Texto de copyright</Label>
        <Input value={(config.copyright as string) || ""} onChange={(e) => setConfig({ ...config, copyright: e.target.value })} className="mt-1" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Links do rodapé</Label>
        <Button size="sm" variant="outline" onClick={addFooterLink}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
      
      {((config.links || []) as FooterLink[]).map((link, index) => (
        <div key={index} className="p-3 bg-muted rounded-lg flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          <Input value={link.label || ""} onChange={(e) => updateFooterLink(index, "label", e.target.value)} placeholder="Texto" className="flex-1" />
          <Input value={link.path || ""} onChange={(e) => updateFooterLink(index, "path", e.target.value)} placeholder="/pagina" className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => removeFooterLink(index)} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  const renderModuleSpecificEditor = () => {
    switch (module.module_id) {
      case "desktop_hero_carousel":
        return renderCarouselEditor();
      case "desktop_features_section":
        return renderFeaturesEditor();
      case "desktop_curiosities_section":
        return renderCuriositiesEditor();
      case "desktop_about_section":
        return renderAboutEditor();
      case "desktop_testimonials_section":
        return renderTestimonialsEditor();
      case "desktop_professional_form":
        return renderFormEditor();
      case "desktop_footer":
        return renderFooterEditor();
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Editor para este tipo de módulo em desenvolvimento</p>
          </div>
        );
    }
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
          <Button size="sm" onClick={handleSave} disabled={updateModule.isPending || updateConfig.isPending || uploading}>
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
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="p-4 space-y-4">
            {renderModuleSpecificEditor()}
          </TabsContent>
          
          <TabsContent value="settings" className="p-4 space-y-4">
            <div>
              <Label htmlFor="name">Nome do módulo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Apenas para organização interna</p>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visível no site</Label>
              <Switch id="visible" checked={isVisible} onCheckedChange={setIsVisible} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Button className="w-full" onClick={handleSave} disabled={updateModule.isPending || updateConfig.isPending || uploading}>
          <Save className="w-4 h-4 mr-2" />
          Salvar alterações
        </Button>
      </div>
      
      {/* AI Image Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gerar imagem com IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Descreva a imagem desejada</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Torcedores vibrando em um estádio de futebol ao pôr do sol, atmosfera épica..."
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seja descritivo para melhores resultados. A IA gerará uma imagem 1920x1080.
              </p>
            </div>
            
            {aiGenerating && (
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-3 text-muted-foreground">Gerando imagem...</span>
              </div>
            )}
            
            {aiGeneratedImage && !aiGenerating && (
              <div className="space-y-2">
                <Label>Imagem gerada</Label>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                  <img 
                    src={aiGeneratedImage} 
                    alt="AI Generated" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            {!aiGeneratedImage ? (
              <Button 
                onClick={handleAiGenerate} 
                disabled={aiGenerating || !aiPrompt.trim()}
                className="w-full sm:w-auto"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar imagem
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleAiGenerate}
                  disabled={aiGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refazer
                </Button>
                <Button onClick={handleApplyAiImage}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Usar esta imagem
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopModuleEditor;
