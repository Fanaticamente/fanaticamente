import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface SelectedElement {
  moduleId: string;
  blockId: string;
  blockType: string;
  blockData: Record<string, unknown>;
}

interface BlockOperation {
  type: "update" | "delete" | "duplicate" | "move" | "add";
  moduleId: string;
  blockId: string;
  data?: Record<string, unknown>;
  direction?: "up" | "down";
  newBlockId?: string;
}

interface VisualEditorContextType {
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement | null) => void;
  hoveredElement: string | null;
  setHoveredElement: (id: string | null) => void;
  pendingChanges: Map<string, Record<string, unknown>>;
  pendingOperations: BlockOperation[];
  updateBlockData: (moduleId: string, blockId: string, updates: Record<string, unknown>) => void;
  deleteBlock: (moduleId: string, blockId: string) => void;
  duplicateBlock: (moduleId: string, blockId: string) => void;
  moveBlock: (moduleId: string, blockId: string, direction: "up" | "down") => void;
  addBlock: (moduleId: string, blockType: string, afterBlockId?: string) => void;
  saveAllChanges: () => Promise<void>;
  discardChanges: () => void;
  hasChanges: boolean;
}

const VisualEditorContext = createContext<VisualEditorContextType | null>(null);

export const useVisualEditor = () => {
  const context = useContext(VisualEditorContext);
  if (!context) {
    throw new Error("useVisualEditor must be used within VisualEditorProvider");
  }
  return context;
};

interface VisualEditorProviderProps {
  children: ReactNode;
  onSave?: (changes: Map<string, Record<string, unknown>>, operations: BlockOperation[]) => Promise<void>;
}

// Simple UUID generator for block IDs
const generateBlockId = () => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const VisualEditorProvider = ({ children, onSave }: VisualEditorProviderProps) => {
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<BlockOperation[]>([]);

  const hasChanges = pendingChanges.size > 0 || pendingOperations.length > 0;

  const updateBlockData = useCallback((moduleId: string, blockId: string, updates: Record<string, unknown>) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const key = `${moduleId}:${blockId}`;
      const existing = newMap.get(key) || {};
      newMap.set(key, { ...existing, ...updates, moduleId, blockId });
      return newMap;
    });
  }, []);

  const deleteBlock = useCallback((moduleId: string, blockId: string) => {
    setPendingOperations(prev => [
      ...prev,
      { type: "delete", moduleId, blockId }
    ]);
  }, []);

  const duplicateBlock = useCallback((moduleId: string, blockId: string) => {
    const newBlockId = generateBlockId();
    setPendingOperations(prev => [
      ...prev,
      { type: "duplicate", moduleId, blockId, newBlockId }
    ]);
  }, []);

  const moveBlock = useCallback((moduleId: string, blockId: string, direction: "up" | "down") => {
    setPendingOperations(prev => [
      ...prev,
      { type: "move", moduleId, blockId, direction }
    ]);
  }, []);

  const addBlock = useCallback((moduleId: string, blockType: string, afterBlockId?: string) => {
    const newBlockId = generateBlockId();
    const defaultData: Record<string, unknown> = {
      id: newBlockId,
      type: blockType,
    };

    // Set default content based on block type
    switch (blockType) {
      case "heading":
        defaultData.content = "Novo Título";
        defaultData.level = 2;
        break;
      case "text":
        defaultData.content = "Novo parágrafo de texto...";
        break;
      case "image":
        defaultData.src = "";
        defaultData.alt = "";
        break;
      case "button":
        defaultData.content = "Clique aqui";
        defaultData.link = "#";
        break;
      case "spacer":
        defaultData.height = 40;
        break;
      case "card":
        defaultData.content = "Conteúdo do card";
        defaultData.backgroundColor = "#f5f5f5";
        break;
    }

    setPendingOperations(prev => [
      ...prev,
      { 
        type: "add", 
        moduleId, 
        blockId: afterBlockId || "", 
        newBlockId,
        data: defaultData
      }
    ]);
  }, []);

  const saveAllChanges = useCallback(async () => {
    if (onSave) {
      await onSave(pendingChanges, pendingOperations);
    }
    setPendingChanges(new Map());
    setPendingOperations([]);
  }, [pendingChanges, pendingOperations, onSave]);

  const discardChanges = useCallback(() => {
    setPendingChanges(new Map());
    setPendingOperations([]);
    setSelectedElement(null);
  }, []);

  return (
    <VisualEditorContext.Provider
      value={{
        editMode,
        setEditMode,
        selectedElement,
        setSelectedElement,
        hoveredElement,
        setHoveredElement,
        pendingChanges,
        pendingOperations,
        updateBlockData,
        deleteBlock,
        duplicateBlock,
        moveBlock,
        addBlock,
        saveAllChanges,
        discardChanges,
        hasChanges,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};

export type { BlockOperation };
