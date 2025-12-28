import { 
  Layout, Image, Users, Ticket, Brain, Radio, GraduationCap, 
  Navigation, ShoppingBag, Trophy, Calendar, Phone, List, 
  MessageSquare, Video, Mic, FileText, Link, Grid
} from "lucide-react";

interface ModuleType {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const MODULE_TYPES: ModuleType[] = [
  { id: "page", name: "Página", icon: FileText, description: "Página completa" },
  { id: "carousel", name: "Carrossel", icon: Image, description: "Banner rotativo" },
  { id: "card", name: "Card", icon: Layout, description: "Card de conteúdo" },
  { id: "list", name: "Lista", icon: List, description: "Lista de itens" },
  { id: "navigation", name: "Navegação", icon: Navigation, description: "Menu de navegação" },
  { id: "grid", name: "Grade", icon: Grid, description: "Layout em grade" },
  { id: "contact", name: "Contato", icon: Phone, description: "Formulário de contato" },
  { id: "calendar", name: "Agenda", icon: Calendar, description: "Agendamento" },
  { id: "shop", name: "Loja", icon: ShoppingBag, description: "Comércio" },
  { id: "users", name: "Usuários", icon: Users, description: "Lista de perfis" },
  { id: "video", name: "Vídeo", icon: Video, description: "Player de vídeo" },
  { id: "podcast", name: "Podcast", icon: Mic, description: "Áudio/Podcast" },
  { id: "link", name: "Link Externo", icon: Link, description: "URL externa" },
  { id: "forum", name: "Fórum", icon: MessageSquare, description: "Discussões" },
];

interface ModuleCatalogProps {
  onAddModule?: (moduleType: string) => void;
}

const ModuleCatalog = ({ onAddModule }: ModuleCatalogProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg text-card-foreground">Conteúdo do App</h3>
        <p className="text-xs text-muted-foreground mt-1">Arraste para adicionar</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {MODULE_TYPES.map((module) => (
            <button
              key={module.id}
              onClick={() => onAddModule?.(module.id)}
              className="flex flex-col items-center p-4 bg-muted hover:bg-muted/80 rounded-xl transition-all hover:scale-105 group cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("moduleType", module.id);
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-2 group-hover:border-primary transition-colors">
                <module.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-medium text-card-foreground text-center">
                {module.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleCatalog;
