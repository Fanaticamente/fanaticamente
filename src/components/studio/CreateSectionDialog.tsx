import { useState } from "react";
import { Plus, Layout, Image, Type, List, Grid, MessageSquare, Users, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateModule } from "@/hooks/useAppModules";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: string;
  existingModulesCount: number;
}

const SECTION_TYPES = [
  { id: "hero", name: "Hero/Banner", icon: Image, description: "Banner principal com imagem de fundo" },
  { id: "text_section", name: "Seção de Texto", icon: Type, description: "Título, subtítulo e texto" },
  { id: "image_section", name: "Seção de Imagem", icon: Image, description: "Imagem com legenda" },
  { id: "features", name: "Cards/Features", icon: Grid, description: "Grade de cards com ícones" },
  { id: "testimonials", name: "Depoimentos", icon: MessageSquare, description: "Carrossel de depoimentos" },
  { id: "team", name: "Equipe/Perfis", icon: Users, description: "Grid de membros da equipe" },
  { id: "gallery", name: "Galeria", icon: Grid, description: "Grade de imagens" },
  { id: "cta", name: "Call to Action", icon: Layout, description: "Seção de chamada para ação" },
  { id: "faq", name: "FAQ", icon: List, description: "Perguntas frequentes" },
  { id: "contact", name: "Contato", icon: FileText, description: "Formulário de contato" },
  { id: "custom", name: "Seção Personalizada", icon: Layout, description: "Conteúdo livre" },
];

const PAGES = [
  { id: "desktop", name: "Desktop/Web" },
  { id: "home", name: "Home (Mobile)" },
  { id: "terapeutas", name: "Terapeutas" },
  { id: "shop", name: "Loja" },
];

const CreateSectionDialog = ({ 
  open, 
  onOpenChange, 
  currentPage,
  existingModulesCount 
}: CreateSectionDialogProps) => {
  const [name, setName] = useState("");
  const [sectionType, setSectionType] = useState("");
  const [page, setPage] = useState(currentPage);
  const [position, setPosition] = useState<string>((existingModulesCount).toString());

  const queryClient = useQueryClient();
  const createModule = useCreateModule();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Digite um nome para a seção");
      return;
    }
    if (!sectionType) {
      toast.error("Selecione um tipo de seção");
      return;
    }

    const moduleId = `${page}_${sectionType}_${Date.now()}`;
    
    // Default config based on section type
    const defaultConfig = getDefaultConfig(sectionType);

    try {
      await createModule.mutateAsync({
        module_id: moduleId,
        module_type: sectionType,
        name,
        description: SECTION_TYPES.find(t => t.id === sectionType)?.description || null,
        icon: "layout",
        is_visible: true,
        order_index: parseInt(position),
        page,
        config: defaultConfig,
      });
      
      // Invalidate queries to refresh preview
      await queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      await queryClient.invalidateQueries({ queryKey: ["desktop-modules-preview"] });
      
      // Reset form
      setName("");
      setSectionType("");
      setPosition((existingModulesCount + 1).toString());
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "hero":
        return {
          title: "Título do Hero",
          subtitle: "Subtítulo descritivo",
          backgroundImage: "",
          cta: "Saiba mais",
          ctaLink: "#",
        };
      case "text_section":
        return {
          title: "Título da Seção",
          subtitle: "",
          content: "Conteúdo de texto aqui...",
          alignment: "center",
        };
      case "image_section":
        return {
          image: "",
          caption: "",
          alt: "",
        };
      case "features":
        return {
          title: "Nossos Diferenciais",
          items: [
            { icon: "star", title: "Feature 1", description: "Descrição da feature" },
          ],
        };
      case "testimonials":
        return {
          title: "O que dizem sobre nós",
          testimonials: [
            { name: "Nome", role: "Cargo", text: "Depoimento aqui...", avatar: "" },
          ],
        };
      case "team":
        return {
          title: "Nossa Equipe",
          members: [
            { name: "Nome", role: "Cargo", image: "", bio: "" },
          ],
        };
      case "gallery":
        return {
          title: "Galeria",
          images: [],
          columns: 3,
        };
      case "cta":
        return {
          title: "Pronto para começar?",
          subtitle: "Entre em contato conosco",
          buttonText: "Começar agora",
          buttonLink: "#",
          backgroundColor: "#10b981",
        };
      case "faq":
        return {
          title: "Perguntas Frequentes",
          items: [
            { question: "Pergunta exemplo?", answer: "Resposta exemplo." },
          ],
        };
      case "contact":
        return {
          title: "Entre em Contato",
          subtitle: "Preencha o formulário abaixo",
          fields: ["name", "email", "message"],
        };
      case "custom":
        return {
          blocks: [
            { type: "text", content: "Conteúdo personalizado" },
          ],
        };
      default:
        return {};
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Criar Nova Seção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Section Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Seção</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banner Principal, Depoimentos..."
            />
          </div>

          {/* Section Type */}
          <div className="space-y-2">
            <Label>Tipo de Seção</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {SECTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSectionType(type.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                    sectionType === type.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <type.icon className={`w-5 h-5 mb-1 ${
                    sectionType === type.id ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <span className="text-xs text-center font-medium">{type.name}</span>
                </button>
              ))}
            </div>
            {sectionType && (
              <p className="text-xs text-muted-foreground">
                {SECTION_TYPES.find(t => t.id === sectionType)?.description}
              </p>
            )}
          </div>

          {/* Page Selection */}
          <div className="space-y-2">
            <Label>Página</Label>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a página" />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Posição</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: existingModulesCount + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i === 0 ? "Início (primeira seção)" : 
                     i === existingModulesCount ? "Final (última seção)" : 
                     `Posição ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createModule.isPending}>
            {createModule.isPending ? "Criando..." : "Criar Seção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSectionDialog;
