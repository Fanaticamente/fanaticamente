import { useState } from "react";
import { 
  GripVertical, Eye, EyeOff, ChevronRight, ChevronDown, 
  MoreVertical, Trash2, Copy, Home, Layout, Image, 
  Users, MessageSquare, FileText, LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Placeholder types for desktop modules (will be connected to DB later)
interface DesktopModule {
  id: string;
  name: string;
  section: string;
  icon: string;
  is_visible: boolean;
  order_index: number;
}

interface DesktopModuleListProps {
  selectedModuleId?: string;
  onSelectModule: (module: DesktopModule) => void;
}

const iconMap: Record<string, LucideIcon> = {
  layout: Layout,
  image: Image,
  users: Users,
  "message-square": MessageSquare,
  "file-text": FileText,
  home: Home,
};

const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Layout;
};

// Placeholder desktop sections and modules
const DESKTOP_SECTIONS = [
  { id: "hero", name: "Hero / Banner Principal", icon: Home },
  { id: "features", name: "Seção Diferenciais", icon: Layout },
  { id: "about", name: "Seção Sobre", icon: FileText },
  { id: "testimonials", name: "Depoimentos", icon: MessageSquare },
  { id: "professionals", name: "Formulário Profissionais", icon: Users },
  { id: "footer", name: "Rodapé", icon: Layout },
];

const PLACEHOLDER_MODULES: DesktopModule[] = [
  { id: "hero-carousel", name: "Carrossel Hero", section: "hero", icon: "image", is_visible: true, order_index: 0 },
  { id: "hero-cta", name: "Botão CTA Principal", section: "hero", icon: "layout", is_visible: true, order_index: 1 },
  { id: "feature-1", name: "Card Terapeutas", section: "features", icon: "users", is_visible: true, order_index: 0 },
  { id: "feature-2", name: "Card Entretenimento", section: "features", icon: "layout", is_visible: true, order_index: 1 },
  { id: "feature-3", name: "Card Conhecimento", section: "features", icon: "file-text", is_visible: true, order_index: 2 },
  { id: "feature-4", name: "Card Camisas", section: "features", icon: "layout", is_visible: true, order_index: 3 },
  { id: "about-text", name: "Texto Sobre", section: "about", icon: "file-text", is_visible: true, order_index: 0 },
  { id: "about-image", name: "Imagem Mac Mockup", section: "about", icon: "image", is_visible: true, order_index: 1 },
  { id: "testimonial-1", name: "Depoimento 1", section: "testimonials", icon: "message-square", is_visible: true, order_index: 0 },
  { id: "testimonial-2", name: "Depoimento 2", section: "testimonials", icon: "message-square", is_visible: true, order_index: 1 },
  { id: "testimonial-3", name: "Depoimento 3", section: "testimonials", icon: "message-square", is_visible: true, order_index: 2 },
  { id: "pro-form", name: "Formulário de Cadastro", section: "professionals", icon: "users", is_visible: true, order_index: 0 },
  { id: "footer-links", name: "Links do Rodapé", section: "footer", icon: "layout", is_visible: true, order_index: 0 },
  { id: "footer-social", name: "Redes Sociais", section: "footer", icon: "layout", is_visible: true, order_index: 1 },
];

const DesktopModuleList = ({ 
  selectedModuleId, 
  onSelectModule
}: DesktopModuleListProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["hero", "features"]);
  const [modules] = useState<DesktopModule[]>(PLACEHOLDER_MODULES);

  const toggleExpand = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId) 
        : [...prev, sectionId]
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg text-card-foreground">Seções do Site</h3>
        <p className="text-xs text-muted-foreground mt-1">Organize o conteúdo desktop</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {DESKTOP_SECTIONS.map((section) => {
          const sectionModules = modules.filter(m => m.section === section.id);
          const isExpanded = expandedSections.includes(section.id);
          const SectionIcon = section.icon;
          
          return (
            <div key={section.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => toggleExpand(section.id)}
                className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
              >
                <SectionIcon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium text-card-foreground">
                  {section.name}
                </span>
                <span className="text-xs text-muted-foreground mr-2">
                  {sectionModules.length}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="pb-2">
                  {sectionModules.map((module) => {
                    const ModuleIcon = getIconComponent(module.icon);
                    const isSelected = selectedModuleId === module.id;
                    
                    return (
                      <div
                        key={module.id}
                        className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-secondary/20 border border-secondary/30" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => onSelectModule(module)}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <ModuleIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!module.is_visible && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                oculto
                              </span>
                            )}
                            <span className={`text-sm truncate ${
                              module.is_visible ? "text-card-foreground" : "text-muted-foreground"
                            }`}>
                              {module.name}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle visibility - will be connected to DB later
                          }}
                        >
                          {module.is_visible ? (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Mover para cima
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Mover para baixo
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  
                  {sectionModules.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum módulo nesta seção
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DesktopModuleList;
