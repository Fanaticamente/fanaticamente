import { useState, useCallback } from "react";
import { RefreshCw, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StaticDesktopView from "./StaticDesktopView";
import VisualEditorPanel from "./VisualEditorPanel";
import { VisualEditorProvider, useVisualEditor } from "./VisualEditorContext";
import type { Json } from "@/integrations/supabase/types";

const DesktopPreviewContent = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { editMode, setEditMode, selectedElement, pendingChanges, discardChanges } = useVisualEditor();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    try {
      // Group changes by module
      const moduleChanges = new Map<string, { moduleId: string; blocks: Map<string, Record<string, unknown>> }>();
      
      pendingChanges.forEach((change) => {
        const moduleId = change.moduleId as string;
        const blockId = change.blockId as string;
        
        if (!moduleChanges.has(moduleId)) {
          moduleChanges.set(moduleId, { moduleId, blocks: new Map() });
        }
        moduleChanges.get(moduleId)!.blocks.set(blockId, change);
      });

      // Apply changes to each module
      for (const [moduleId, { blocks }] of moduleChanges) {
        // Fetch current module config
        const { data: moduleData } = await supabase
          .from("app_modules")
          .select("config")
          .eq("id", moduleId)
          .single();

        if (!moduleData) continue;

        const currentConfig = moduleData.config as Record<string, unknown>;
        const currentBlocks = (currentConfig.blocks || []) as Array<Record<string, unknown>>;

        // Update blocks with changes
        const updatedBlocks = currentBlocks.map(block => {
          const blockId = block.id as string;
          const blockChanges = blocks.get(blockId);
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
    if (editMode && pendingChanges.size > 0) {
      // Prompt to save or discard
      const confirmed = window.confirm("Você tem alterações não salvas. Deseja descartá-las?");
      if (!confirmed) return;
      discardChanges();
    }
    setEditMode(!editMode);
  };

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
          {editMode && pendingChanges.size > 0 && (
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
                Salvar ({pendingChanges.size})
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
