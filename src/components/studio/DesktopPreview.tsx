import { useState } from "react";
import { RefreshCw, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StaticDesktopView from "./StaticDesktopView";
import VisualEditorPanel from "./VisualEditorPanel";
import { VisualEditorProvider, useVisualEditor, BlockOperation } from "./VisualEditorContext";
import type { Json } from "@/integrations/supabase/types";

interface ContentBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

const DesktopPreviewContent = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { 
    editMode, 
    setEditMode, 
    selectedElement, 
    pendingChanges, 
    pendingOperations,
    discardChanges,
    hasChanges 
  } = useVisualEditor();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const applyOperations = (blocks: ContentBlock[], operations: BlockOperation[], moduleId: string): ContentBlock[] => {
    let result = [...blocks];

    for (const op of operations) {
      if (op.moduleId !== moduleId) continue;

      switch (op.type) {
        case "delete":
          result = result.filter(b => b.id !== op.blockId);
          break;

        case "duplicate": {
          const sourceIndex = result.findIndex(b => b.id === op.blockId);
          if (sourceIndex !== -1) {
            const source = result[sourceIndex];
            const duplicate = { ...source, id: op.newBlockId || `dup-${Date.now()}` };
            result.splice(sourceIndex + 1, 0, duplicate);
          }
          break;
        }

        case "move": {
          const index = result.findIndex(b => b.id === op.blockId);
          if (index !== -1) {
            const newIndex = op.direction === "up" ? index - 1 : index + 1;
            if (newIndex >= 0 && newIndex < result.length) {
              const [moved] = result.splice(index, 1);
              result.splice(newIndex, 0, moved);
            }
          }
          break;
        }

        case "add": {
          const newBlock = op.data as ContentBlock;
          if (op.blockId) {
            const afterIndex = result.findIndex(b => b.id === op.blockId);
            if (afterIndex !== -1) {
              result.splice(afterIndex + 1, 0, newBlock);
            } else {
              result.push(newBlock);
            }
          } else {
            result.push(newBlock);
          }
          break;
        }
      }
    }

    return result;
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    try {
      // Collect all affected modules
      const affectedModules = new Set<string>();
      
      pendingChanges.forEach((change) => {
        affectedModules.add(change.moduleId as string);
      });
      
      pendingOperations.forEach((op) => {
        affectedModules.add(op.moduleId);
      });

      // Process each module
      for (const moduleId of affectedModules) {
        // Fetch current module config
        const { data: moduleData } = await supabase
          .from("app_modules")
          .select("config")
          .eq("id", moduleId)
          .single();

        if (!moduleData) continue;

        const currentConfig = moduleData.config as Record<string, unknown>;
        let currentBlocks = (currentConfig.blocks || []) as ContentBlock[];

        // Apply operations (delete, duplicate, move, add)
        currentBlocks = applyOperations(currentBlocks, pendingOperations, moduleId);

        // Apply data updates
        const updatedBlocks = currentBlocks.map(block => {
          const key = `${moduleId}:${block.id}`;
          const blockChanges = pendingChanges.get(key);
          if (blockChanges) {
            const { moduleId: _, blockId: __, ...updates } = blockChanges;
            return { ...block, ...updates };
          }
          return block;
        });

        // Save updated config
        await supabase
          .from("app_modules")
          .update({ config: { ...currentConfig, blocks: updatedBlocks } as unknown as Json })
          .eq("id", moduleId);
      }

      await queryClient.invalidateQueries({ queryKey: ["desktop-modules-preview"] });
      await queryClient.invalidateQueries({ queryKey: ["app-modules"] });
      
      discardChanges();
      toast.success("Alterações salvas!");
      handleRefresh();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleToggleEditMode = () => {
    if (editMode && hasChanges) {
      const confirmed = window.confirm("Você tem alterações não salvas. Deseja descartá-las?");
      if (!confirmed) return;
      discardChanges();
    }
    setEditMode(!editMode);
  };

  const totalChanges = pendingChanges.size + pendingOperations.length;

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-card-foreground">Preview Desktop</span>
          {editMode && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
              Modo Edição Visual
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {editMode && hasChanges && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { discardChanges(); handleRefresh(); }}
                className="h-8 gap-2 text-destructive"
              >
                <X className="w-4 h-4" />
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                className="h-8 gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar ({totalChanges})
              </Button>
            </>
          )}
          
          <Button
            size="sm"
            variant={editMode ? "default" : "outline"}
            onClick={handleToggleEditMode}
            className="h-8 gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {editMode ? "Sair" : "Editar Visual"}
          </Button>
          
          {!editMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-8 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-auto ${editMode ? 'cursor-crosshair' : ''}`}>
          <StaticDesktopView key={refreshKey} />
        </div>
        
        {/* Side Panel for editing selected element */}
        {editMode && selectedElement && <VisualEditorPanel />}
      </div>

      {/* Edit Mode Instructions */}
      {editMode && !selectedElement && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 z-50">
          <Edit3 className="w-4 h-4" />
          Clique em um elemento para editar
        </div>
      )}
    </div>
  );
};

const DesktopPreview = () => {
  return (
    <VisualEditorProvider>
      <DesktopPreviewContent />
    </VisualEditorProvider>
  );
};

export default DesktopPreview;
