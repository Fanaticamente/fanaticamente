import { useRef, useState, useEffect, ReactNode } from "react";
import { useVisualEditor } from "./VisualEditorContext";
import { 
  Move, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Type, 
  Image, 
  Settings,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EditableBlockProps {
  moduleId: string;
  blockId: string;
  blockType: string;
  blockData: Record<string, unknown>;
  children: ReactNode;
  className?: string;
  isText?: boolean;
}

const BLOCK_TYPE_LABELS: Record<string, { label: string; icon: typeof Type }> = {
  heading: { label: "Título", icon: Type },
  text: { label: "Texto", icon: Type },
  image: { label: "Imagem", icon: Image },
  button: { label: "Botão", icon: Move },
  spacer: { label: "Espaçador", icon: Move },
  card: { label: "Card", icon: Move },
};

const EditableBlock = ({
  moduleId,
  blockId,
  blockType,
  blockData,
  children,
  className,
  isText = false,
}: EditableBlockProps) => {
  const {
    editMode,
    selectedElement,
    setSelectedElement,
    hoveredElement,
    setHoveredElement,
    updateBlockData,
    deleteBlock,
    duplicateBlock,
    moveBlock,
  } = useVisualEditor();

  const elementRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(blockData.content as string || "");
  const [isDragging, setIsDragging] = useState(false);

  const elementKey = `${moduleId}:${blockId}`;
  const isSelected = selectedElement?.moduleId === moduleId && selectedElement?.blockId === blockId;
  const isHovered = hoveredElement === elementKey;

  const blockInfo = BLOCK_TYPE_LABELS[blockType] || { label: blockType, icon: Move };
  const BlockIcon = blockInfo.icon;

  useEffect(() => {
    setEditableContent(blockData.content as string || "");
  }, [blockData.content]);

  const handleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.stopPropagation();

    setSelectedElement({
      moduleId,
      blockId,
      blockType,
      blockData,
    });

    if (isText && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.stopPropagation();
    
    if (isText) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (isEditing && editableContent !== blockData.content) {
      updateBlockData(moduleId, blockId, { content: editableContent });
    }
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    if (editMode && !isDragging) {
      setHoveredElement(elementKey);
    }
  };

  const handleMouseLeave = () => {
    if (editMode && !isDragging) {
      setHoveredElement(null);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(moduleId, blockId);
    setSelectedElement(null);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateBlock(moduleId, blockId);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveBlock(moduleId, blockId, "up");
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveBlock(moduleId, blockId, "down");
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("block-id", blockId);
    e.dataTransfer.setData("module-id", moduleId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  if (!editMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative group transition-all duration-150",
        isHovered && !isSelected && "outline outline-2 outline-dashed outline-primary/60",
        isSelected && "outline outline-2 outline-primary outline-offset-1",
        isDragging && "opacity-50",
        editMode && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={editMode && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Element Type Label - appears on hover/select */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-6 left-0 z-50 flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-t shadow-lg">
          <BlockIcon className="w-3 h-3" />
          <span>{blockInfo.label}</span>
        </div>
      )}

      {/* Floating Toolbar - appears when selected */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-card rounded-lg shadow-xl border border-border px-2 py-1">
          {/* Drag Handle */}
          <div 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted rounded"
            title="Arrastar"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Quick Actions */}
          {isText && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Type className="w-3.5 h-3.5 mr-1" />
              Editar
            </Button>
          )}

          {blockType === "image" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Image className="w-3.5 h-3.5 mr-1" />
              Alterar
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => e.stopPropagation()}
            title="Configurações"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Move Buttons */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleMoveUp}
            title="Mover para cima"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleMoveDown}
            title="Mover para baixo"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Duplicate */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleDuplicate}
            title="Duplicar"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Resize Handles - only for images and cards */}
      {isSelected && (blockType === "image" || blockType === "card") && (
        <>
          {/* Corner handles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nw-resize border-2 border-background shadow-sm" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-ne-resize border-2 border-background shadow-sm" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-sw-resize border-2 border-background shadow-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-background shadow-sm" />
          
          {/* Edge handles */}
          <div className="absolute top-1/2 -left-1.5 w-2 h-6 -translate-y-1/2 bg-primary rounded cursor-w-resize border border-background shadow-sm" />
          <div className="absolute top-1/2 -right-1.5 w-2 h-6 -translate-y-1/2 bg-primary rounded cursor-e-resize border border-background shadow-sm" />
          <div className="absolute -top-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-primary rounded cursor-n-resize border border-background shadow-sm" />
          <div className="absolute -bottom-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-primary rounded cursor-s-resize border border-background shadow-sm" />
        </>
      )}

      {/* Editable text content */}
      {isText && isEditing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          className="outline-none bg-primary/10 min-h-[1em] p-1 -m-1 rounded"
          onBlur={handleBlur}
          onInput={(e) => setEditableContent(e.currentTarget.textContent || "")}
          dangerouslySetInnerHTML={{ __html: editableContent }}
          style={{
            whiteSpace: "pre-wrap",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        children
      )}
    </div>
  );
};

export default EditableBlock;
