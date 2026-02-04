import { useState } from "react";
import { 
  GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, 
  MoreVertical, Trash2, Copy, Loader2, Plus, ChevronRight,
  Home, Layout, Image, Users, MessageSquare, FileText, BarChart, Grid, Type, List, LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppModules, useToggleModuleVisibility, useDeleteModule, useReorderModules, AppModule } from "@/hooks/useAppModules";
import CreateSectionDialog from "./CreateSectionDialog";
import PagesList from "./PagesList";

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
  grid: Grid,
  type: Type,
  list: List,
};

const moduleTypeIcons: Record<string, LucideIcon> = {
  hero: Image,
  carousel: Image,
  text_section: Type,
  image_section: Image,
  features: Grid,
  testimonials: MessageSquare,
  team: Users,
  gallery: Grid,
  cta: Layout,
  faq: List,
  contact: FileText,
  custom: Layout,
  section: Layout,
  dynamic_section: Layout,
};

const getIconComponent = (module: AppModule): LucideIcon => {
  // Try module type first
  if (moduleTypeIcons[module.module_type]) {
    return moduleTypeIcons[module.module_type];
  }
  // Fall back to icon field
  return iconMap[module.icon || "layout"] || Layout;
};

const DesktopModuleList = ({ 
  selectedModuleId, 
  onSelectModule
}: DesktopModuleListProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPages, setShowPages] = useState(false);
  
  const { data: modules, isLoading } = useAppModules("desktop");
  const toggleVisibility = useToggleModuleVisibility();
  const deleteModule = useDeleteModule();
  const reorderModules = useReorderModules();

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

  const handleMoveModule = async (module: AppModule, direction: "up" | "down") => {
    if (!modules) return;
    
    const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedModules.findIndex(m => m.id === module.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sortedModules.length) return;
    
    // Swap order indices
    const updates = [
      { id: sortedModules[currentIndex].id, order_index: sortedModules[targetIndex].order_index },
      { id: sortedModules[targetIndex].id, order_index: sortedModules[currentIndex].order_index },
    ];
    
    reorderModules.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedModules = [...(modules || [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-card-foreground">Seções do Site</h3>
            <p className="text-xs text-muted-foreground mt-1">Clique para editar, setas para mover</p>
          </div>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        </div>
      </div>
      
      {/* Pages Section Toggle */}
      <button
        onClick={() => setShowPages(!showPages)}
        className="w-full flex items-center gap-2 p-3 border-b border-border hover:bg-muted/50 transition-colors"
      >
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-left text-sm font-medium text-card-foreground">
          Páginas do Sistema
        </span>
        {showPages ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {showPages && (
        <div className="border-b border-border">
          <PagesList platform="desktop" />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2">
        {sortedModules.map((module, index) => {
          const ModuleIcon = getIconComponent(module);
          const isSelected = selectedModuleId === module.id;
          
          return (
            <div
              key={module.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
                isSelected 
                  ? "bg-secondary/20 border border-secondary/30" 
                  : "hover:bg-muted/50 border border-transparent"
              }`}
              onClick={() => onSelectModule(module)}
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveModule(module, "up");
                  }}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveModule(module, "down");
                  }}
                  disabled={index === sortedModules.length - 1}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ModuleIcon className="w-4 h-4 text-muted-foreground" />
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
              
              {!module.is_visible && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                  oculto
                </span>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
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
                    className="h-7 w-7 p-0 flex-shrink-0"
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
          );
        })}
        
        {(!modules || modules.length === 0) && (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Nenhuma seção encontrada</p>
            <p className="text-xs mt-1">Clique em "Nova" para criar uma seção</p>
          </div>
        )}
      </div>

      <CreateSectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentPage="desktop"
        existingModulesCount={modules?.length || 0}
      />
    </div>
  );
};

export default DesktopModuleList;
