import { useState } from "react";
import { 
  GripVertical, Eye, EyeOff, ChevronRight, ChevronDown, 
  MoreVertical, Trash2, Copy, Loader2,
  Home, Layout, Image, Users, MessageSquare, FileText, BarChart, LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppModules, useToggleModuleVisibility, useDeleteModule, AppModule } from "@/hooks/useAppModules";

interface DesktopModuleListProps {
  selectedModuleId?: string;
  onSelectModule: (module: AppModule) => void;
}

const iconMap: Record<string, LucideIcon> = {
  layout: Layout,
  image: Image,
  users: Users,
  "message-square": MessageSquare,
  "file-text": FileText,
  "bar-chart": BarChart,
  home: Home,
};

const getIconComponent = (iconName: string | null): LucideIcon => {
  return iconMap[iconName || "layout"] || Layout;
};

// Desktop sections to group modules
const DESKTOP_SECTIONS = [
  { id: "desktop_hero_carousel", name: "Hero / Banner Principal", icon: Home },
  { id: "desktop_features_section", name: "Seção Diferenciais", icon: Layout },
  { id: "desktop_curiosities_section", name: "Seção Curiosidades", icon: BarChart },
  { id: "desktop_about_section", name: "Seção Sobre", icon: FileText },
  { id: "desktop_testimonials_section", name: "Depoimentos", icon: MessageSquare },
  { id: "desktop_professional_form", name: "Formulário Profissionais", icon: Users },
  { id: "desktop_footer", name: "Rodapé", icon: Layout },
];

const DesktopModuleList = ({ 
  selectedModuleId, 
  onSelectModule
}: DesktopModuleListProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(["desktop_hero_carousel", "desktop_features_section"]);
  
  const { data: modules, isLoading } = useAppModules("desktop");
  const toggleVisibility = useToggleModuleVisibility();
  const deleteModule = useDeleteModule();

  const toggleExpand = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(s => s !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleToggleVisibility = (module: AppModule) => {
    toggleVisibility.mutate({ id: module.id, is_visible: !module.is_visible });
  };

  const handleDuplicate = (module: AppModule) => {
    // TODO: Implement duplication
    console.log("Duplicate", module);
  };

  const handleDelete = (module: AppModule) => {
    if (confirm(`Tem certeza que deseja excluir "${module.name}"?`)) {
      deleteModule.mutate(module.id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg text-card-foreground">Seções do Site</h3>
        <p className="text-xs text-muted-foreground mt-1">Clique para editar conteúdo</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {DESKTOP_SECTIONS.map((section) => {
          const module = modules?.find(m => m.module_id === section.id);
          const isExpanded = expandedModules.includes(section.id);
          const SectionIcon = section.icon;
          const isSelected = selectedModuleId === module?.id;
          
          if (!module) return null;
          
          return (
            <div key={section.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => toggleExpand(section.id)}
                className={`w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors ${
                  isSelected ? "bg-secondary/20" : ""
                }`}
              >
                <SectionIcon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium text-card-foreground">
                  {section.name}
                </span>
                {!module.is_visible && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    oculto
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="pb-2 px-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-secondary/20 border border-secondary/30" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectModule(module)}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {(() => {
                        const ModuleIcon = getIconComponent(module.icon);
                        return <ModuleIcon className="w-4 h-4 text-muted-foreground" />;
                      })()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm truncate block ${
                        module.is_visible ? "text-card-foreground" : "text-muted-foreground"
                      }`}>
                        {module.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {module.module_type}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(module);
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
                        <DropdownMenuItem onClick={() => handleDuplicate(module)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(module)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {(!modules || modules.length === 0) && (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Nenhum módulo desktop encontrado</p>
            <p className="text-xs mt-1">Os módulos serão criados automaticamente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopModuleList;
