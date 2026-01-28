import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface SelectedElement {
  moduleId: string;
  blockId: string;
  blockType: string;
  blockData: Record<string, unknown>;
}

interface VisualEditorContextType {
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement | null) => void;
  hoveredElement: string | null;
  setHoveredElement: (id: string | null) => void;
  pendingChanges: Map<string, Record<string, unknown>>;
  updateBlockData: (moduleId: string, blockId: string, updates: Record<string, unknown>) => void;
  saveAllChanges: () => Promise<void>;
  discardChanges: () => void;
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
  onSave?: (changes: Map<string, Record<string, unknown>>) => Promise<void>;
}

export const VisualEditorProvider = ({ children, onSave }: VisualEditorProviderProps) => {
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, unknown>>>(new Map());

  const updateBlockData = useCallback((moduleId: string, blockId: string, updates: Record<string, unknown>) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const key = `${moduleId}:${blockId}`;
      const existing = newMap.get(key) || {};
      newMap.set(key, { ...existing, ...updates, moduleId, blockId });
      return newMap;
    });
  }, []);

  const saveAllChanges = useCallback(async () => {
    if (onSave) {
      await onSave(pendingChanges);
    }
    setPendingChanges(new Map());
  }, [pendingChanges, onSave]);

  const discardChanges = useCallback(() => {
    setPendingChanges(new Map());
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
        updateBlockData,
        saveAllChanges,
        discardChanges,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};
