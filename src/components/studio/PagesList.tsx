import { 
  Eye, EyeOff, ChevronUp, ChevronDown, Lock, LockOpen,
  FileText, Home, Users, GraduationCap, Brain, Radio, Trophy,
  ShoppingBag, Heart, Newspaper, Book, User, Calendar, LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppPages, useTogglePageVisibility, useUpdatePage, useReorderPages, AppPage } from "@/hooks/useAppPages";
import { Loader2 } from "lucide-react";

interface PagesListProps {
  platform: "mobile" | "desktop";
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  "graduation-cap": GraduationCap,
  brain: Brain,
  radio: Radio,
  trophy: Trophy,
  "shopping-bag": ShoppingBag,
  heart: Heart,
  newspaper: Newspaper,
  book: Book,
  user: User,
  calendar: Calendar,
  "file-text": FileText,
};

const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || FileText;
};

const PagesList = ({ platform }: PagesListProps) => {
  const { data: pages, isLoading } = useAppPages(platform);
  const toggleVisibility = useTogglePageVisibility();
  const updatePage = useUpdatePage();
  const reorderPages = useReorderPages();

  const handleMoveUp = (page: AppPage, index: number, sortedPages: AppPage[]) => {
    if (index > 0) {
      const updates = [
        { id: sortedPages[index].id, order_index: sortedPages[index - 1].order_index },
        { id: sortedPages[index - 1].id, order_index: sortedPages[index].order_index },
      ];
      reorderPages.mutate(updates);
    }
  };

  const handleMoveDown = (page: AppPage, index: number, sortedPages: AppPage[]) => {
    if (index < sortedPages.length - 1) {
      const updates = [
        { id: sortedPages[index].id, order_index: sortedPages[index + 1].order_index },
        { id: sortedPages[index + 1].id, order_index: sortedPages[index].order_index },
      ];
      reorderPages.mutate(updates);
    }
  };

  const handleTogglePublic = (page: AppPage) => {
    updatePage.mutate({ 
      id: page.id, 
      updates: { is_public: !page.is_public } 
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedPages = [...(pages || [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="p-2 space-y-1">
      {sortedPages.map((page, index) => {
        const PageIcon = getIconComponent(page.icon);
        
        return (
          <div
            key={page.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              page.is_visible 
                ? "hover:bg-muted/50" 
                : "bg-muted/30"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={() => handleMoveUp(page, index, sortedPages)}
                disabled={index === 0}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={() => handleMoveDown(page, index, sortedPages)}
                disabled={index === sortedPages.length - 1}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <PageIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <span className={`text-sm truncate block ${
                page.is_visible ? "text-card-foreground" : "text-muted-foreground"
              }`}>
                {page.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {page.path}
              </span>
            </div>
            
            {!page.is_public && (
              <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded flex-shrink-0">
                login
              </span>
            )}
            
            {!page.is_visible && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                oculto
              </span>
            )}

            {/* Toggle login required */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => handleTogglePublic(page)}
              title={page.is_public ? "Tornar privado (exigir login)" : "Tornar público (sem login)"}
            >
              {page.is_public ? (
                <LockOpen className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-orange-400" />
              )}
            </Button>
            
            {/* Toggle visibility */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => toggleVisibility.mutate({ id: page.id, is_visible: !page.is_visible })}
            >
              {page.is_visible ? (
                <Eye className="w-4 h-4 text-muted-foreground" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        );
      })}
      
      {(!pages || pages.length === 0) && (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Nenhuma página encontrada</p>
        </div>
      )}
    </div>
  );
};

export default PagesList;
