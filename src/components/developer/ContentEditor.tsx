import { useState } from "react";
import { useAppContent, useUpdateContent } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Edit2, Save, X, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ContentEditor = () => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const { data: contents, isLoading } = useAppContent();
  const updateContent = useUpdateContent();

  const categories = contents 
    ? [...new Set(contents.map(c => c.category))]
    : [];

  const filteredContents = contents?.filter(content => {
    const matchesSearch = 
      content.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || content.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    try {
      await updateContent.mutateAsync({ key, value: editValue });
      toast.success("Conteúdo atualizado com sucesso!");
      setEditingKey(null);
    } catch (error) {
      toast.error("Erro ao atualizar conteúdo");
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      header: "bg-primary/20 text-primary",
      auth: "bg-therapy/20 text-therapy",
      home: "bg-secondary/20 text-secondary",
      general: "bg-muted text-muted-foreground",
    };
    return colors[category] || colors.general;
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {filteredContents?.map((content) => (
          <div
            key={content.key}
            className="bg-muted/50 border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {content.key}
                  </code>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(content.category)}`}>
                    {content.category}
                  </span>
                </div>
                {content.description && (
                  <p className="text-xs text-muted-foreground">{content.description}</p>
                )}
              </div>
              
              {editingKey === content.key ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(content.key)}
                    disabled={updateContent.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(content.key, content.value)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {editingKey === content.key ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[80px] font-mono text-sm"
                autoFocus
              />
            ) : (
              <div className="bg-background/50 rounded-lg p-3 text-sm text-card-foreground whitespace-pre-wrap">
                {content.value}
              </div>
            )}
          </div>
        ))}

        {filteredContents?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum conteúdo encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentEditor;
