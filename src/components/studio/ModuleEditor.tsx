import { useState, useEffect } from "react";
import { X, Save, Upload, Plus, Trash2, Link, ImageIcon } from "lucide-react";
import { AppModule, useUpdateModule, useUpdateModuleConfig } from "@/hooks/useAppModules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface ModuleEditorProps {
  module: AppModule | null;
  onClose: () => void;
}

interface SlideConfig {
  image: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
}

const ModuleEditor = ({ module, onClose }: ModuleEditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  
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

  const handleSave = () => {
    updateModule.mutate({
      id: module.id,
      updates: {
        name,
        description: description || null,
        is_visible: isVisible,
      },
    });
    updateConfig.mutate({
      id: module.id,
      config: config as Json,
    });
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
      slides: [...slides, { image: "", title: "", subtitle: "", cta: "SAIBA MAIS", ctaLink: "/" }],
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

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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
                <Label htmlFor="name">Título do módulo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 30 caracteres
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
                      <span className="text-sm font-medium">Slide {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSlide(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Imagem</Label>
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
                            <span className="text-xs text-muted-foreground">Upload (1080 x 540 px)</span>
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
                      <p className="text-xs text-muted-foreground mt-1">Recomendado: 1080 x 540 pixels</p>
                    </div>
                    
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={slide.title || ""}
                        onChange={(e) => updateSlide(index, "title", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Subtítulo</Label>
                      <Input
                        value={slide.subtitle || ""}
                        onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Texto do botão (CTA)</Label>
                      <Input
                        value={slide.cta || ""}
                        onChange={(e) => updateSlide(index, "cta", e.target.value)}
                        className="mt-1"
                        placeholder="SAIBA MAIS"
                      />
                    </div>
                    
                    <div>
                      <Label>Link do botão</Label>
                      <div className="flex gap-2 mt-1">
                        <Link className="w-4 h-4 text-muted-foreground mt-3" />
                        <Input
                          value={slide.ctaLink || ""}
                          onChange={(e) => updateSlide(index, "ctaLink", e.target.value)}
                          placeholder="/terapeutas"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {module.module_type === "card" && (
              <div className="space-y-4">
                <div>
                  <Label>Imagem de fundo</Label>
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
                        <span className="text-xs text-muted-foreground mt-1">Recomendado: 400 x 200 pixels</span>
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
                  <Label>Título do card</Label>
                  <Input
                    value={(config.title as string) || ""}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="mt-1"
                  />
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
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="layout" className="p-4 space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Opções de layout em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button className="w-full" onClick={handleSave} disabled={updateModule.isPending || updateConfig.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default ModuleEditor;
