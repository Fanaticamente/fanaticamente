import { useState } from "react";
import { useAppMenus, useUpdateMenu } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Edit2, Save, X, Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AVAILABLE_ICONS = [
  "Home", "Users", "BookOpen", "Radio", "Newspaper", "User", 
  "Settings", "Heart", "Star", "Calendar", "MessageCircle",
  "Play", "Music", "Video", "Image", "FileText", "Search",
  "Bell", "Mail", "Phone", "MapPin", "Clock", "Briefcase"
];

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

const MenuEditor = () => {
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<MenuItem[]>([]);
  
  const { data: menus, isLoading } = useAppMenus();
  const updateMenu = useUpdateMenu();

  const handleEdit = (menuId: string, items: MenuItem[]) => {
    setEditingMenuId(menuId);
    setEditItems([...items]);
  };

  const handleSave = async (menuId: string) => {
    try {
      await updateMenu.mutateAsync({ menuId, items: editItems });
      toast.success("Menu atualizado com sucesso!");
      setEditingMenuId(null);
      setEditItems([]);
    } catch (error) {
      toast.error("Erro ao atualizar menu");
    }
  };

  const handleCancel = () => {
    setEditingMenuId(null);
    setEditItems([]);
  };

  const addMenuItem = () => {
    setEditItems([...editItems, { icon: "Home", label: "Novo Item", path: "/" }]);
  };

  const removeMenuItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editItems.length) return;
    
    const updated = [...editItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setEditItems(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {menus?.map((menu) => (
        <div
          key={menu.menu_id}
          className="bg-muted/50 border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <code className="text-lg font-mono text-primary bg-primary/10 px-3 py-1 rounded">
                {menu.menu_id}
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                {(menu.items as MenuItem[]).length} itens
              </p>
            </div>
            
            {editingMenuId === menu.menu_id ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(menu.menu_id)}
                  disabled={updateMenu.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(menu.menu_id, menu.items as MenuItem[])}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>

          {editingMenuId === menu.menu_id ? (
            <div className="space-y-3">
              {editItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-background/50 rounded-lg p-3"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-card-foreground disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === editItems.length - 1}
                      className="text-muted-foreground hover:text-card-foreground disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <Select
                    value={item.icon}
                    onValueChange={(value) => updateMenuItem(index, 'icon', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={item.label}
                    onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1"
                  />

                  <Input
                    value={item.path}
                    onChange={(e) => updateMenuItem(index, 'path', e.target.value)}
                    placeholder="/path"
                    className="flex-1"
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMenuItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addMenuItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(menu.items as MenuItem[]).map((item, index) => (
                <div
                  key={index}
                  className="bg-background/50 rounded-lg p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{item.icon}</span>
                    <span className="text-card-foreground">{item.label}</span>
                  </div>
                  <code className="text-xs text-muted-foreground">{item.path}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuEditor;
