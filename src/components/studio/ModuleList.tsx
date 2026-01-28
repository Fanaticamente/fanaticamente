import { useState } from "react";
import { 
  GripVertical, Eye, EyeOff, ChevronRight, ChevronDown, 
  MoreVertical, Trash2, Copy, Home, Navigation as NavIcon,
  Layout, Image, Users, Ticket, Brain, Radio, GraduationCap,
  ShoppingBag, Trophy, LucideIcon
} from "lucide-react";
import { AppModule, useToggleModuleVisibility, useReorderModules } from "@/hooks/useAppModules";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleListProps {
  modules: AppModule[];
  selectedModuleId?: string;
  onSelectModule: (module: AppModule) => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  onChanged?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  layout: Layout,
  image: Image,
  users: Users,
  ticket: Ticket,
  brain: Brain,
  radio: Radio,
  "graduation-cap": GraduationCap,
  "shopping-bag": ShoppingBag,
  trophy: Trophy,
  navigation: NavIcon,
  home: Home,
};

const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Layout;
};

const ModuleList = ({ 
  modules, 
  selectedModuleId, 
  onSelectModule, 
  currentPage,
  onPageChange,
  onChanged,
}: ModuleListProps) => {
  const [expandedPages, setExpandedPages] = useState<string[]>(["home", "navigation", "pages"]);
  const toggleVisibility = useToggleModuleVisibility();
  const reorderModules = useReorderModules();
  
  const pages = [
    { id: "home", name: "Página Principal", icon: Home },
    { id: "navigation", name: "Navegação", icon: NavIcon },
    { id: "pages", name: "Páginas Internas", icon: ChevronRight },
  ];

  const toggleExpand = (pageId: string) => {
    setExpandedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(p => p !== pageId) 
        : [...prev, pageId]
    );
  };

  const handleMoveUp = (module: AppModule, pageModules: AppModule[]) => {
    const currentIndex = pageModules.findIndex(m => m.id === module.id);
    if (currentIndex > 0) {
      const newOrder = pageModules.map((m, i) => ({
        id: m.id,
        order_index: i === currentIndex ? currentIndex - 1 : i === currentIndex - 1 ? currentIndex : i,
      }));
      reorderModules.mutate(newOrder);
      onChanged?.();
    }
  };

  const handleMoveDown = (module: AppModule, pageModules: AppModule[]) => {
    const currentIndex = pageModules.findIndex(m => m.id === module.id);
    if (currentIndex < pageModules.length - 1) {
      const newOrder = pageModules.map((m, i) => ({
        id: m.id,
        order_index: i === currentIndex ? currentIndex + 1 : i === currentIndex + 1 ? currentIndex : i,
      }));
      reorderModules.mutate(newOrder);
      onChanged?.();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg text-card-foreground">Organização</h3>
        <p className="text-xs text-muted-foreground mt-1">Arraste para reordenar</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {pages.map((page) => {
          const pageModules = modules.filter(m => m.page === page.id);
          const isExpanded = expandedPages.includes(page.id);
          const PageIcon = page.icon;
          
          return (
            <div key={page.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => toggleExpand(page.id)}
                className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
              >
                <PageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium text-card-foreground">
                  {page.name}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="pb-2">
                  {pageModules.map((module) => {
                    const ModuleIcon = getIconComponent(module.icon);
                    const isSelected = selectedModuleId === module.id;
                    
                    return (
                      <div
                        key={module.id}
                        className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-primary/20 border border-primary/30" 
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
                            toggleVisibility.mutate({ 
                              id: module.id, 
                              is_visible: !module.is_visible 
                            });
                            onChanged?.();
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
                            <DropdownMenuItem onClick={() => handleMoveUp(module, pageModules)}>
                              Mover para cima
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveDown(module, pageModules)}>
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
                  
                  {pageModules.length === 0 && (
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

export default ModuleList;
