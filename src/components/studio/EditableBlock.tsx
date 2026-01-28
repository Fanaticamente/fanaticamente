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
  GripVertical,
  Maximize2
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
  spacer: { label: "Espaçador", icon: Maximize2 },
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
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const elementKey = `${moduleId}:${blockId}`;
  const isSelected = selectedElement?.moduleId === moduleId && selectedElement?.blockId === blockId;
  const isHovered = hoveredElement === elementKey;

  const blockInfo = BLOCK_TYPE_LABELS[blockType] || { label: blockType, icon: Move };
  const BlockIcon = blockInfo.icon;

  // Get custom dimensions from blockData
  const customWidth = blockData.customWidth as number | undefined;
  const customHeight = blockData.customHeight as number | undefined;
  const customX = blockData.customX as number | undefined;
  const customY = blockData.customY as number | undefined;

  useEffect(() => {
    setEditableContent(blockData.content as string || "");
  }, [blockData.content]);

  const handleClick = (e: React.MouseEvent) => {
    if (!editMode || isResizing || isMoving) return;
    e.stopPropagation();

    setSelectedElement({
      moduleId,
      blockId,
      blockType,
      blockData,
    });
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
    if (editMode && !isDragging && !isResizing && !isMoving) {
      setHoveredElement(elementKey);
    }
  };

  const handleMouseLeave = () => {
    if (editMode && !isDragging && !isResizing && !isMoving) {
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

  // Drag handlers for reordering
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("block-id", blockId);
    e.dataTransfer.setData("module-id", moduleId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handler - changes dimensions for all elements
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!elementRef.current) return;
    
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = elementRef.current.offsetWidth;
    const startHeight = elementRef.current.offsetHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("e")) newWidth = startWidth + deltaX;
      if (direction.includes("w")) newWidth = startWidth - deltaX;
      if (direction.includes("s")) newHeight = startHeight + deltaY;
      if (direction.includes("n")) newHeight = startHeight - deltaY;

      // Apply minimum constraints
      newWidth = Math.max(40, newWidth);
      newHeight = Math.max(40, newHeight);

      // Apply to element immediately for visual feedback
      if (elementRef.current) {
        elementRef.current.style.width = `${newWidth}px`;
        elementRef.current.style.height = `${newHeight}px`;
      }

      // Update block data with new dimensions
      updateBlockData(moduleId, blockId, { 
        customWidth: Math.round(newWidth),
        customHeight: Math.round(newHeight)
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = direction.includes("e") || direction.includes("w") ? "ew-resize" : "ns-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Move/drag handler for repositioning
  const handleMoveStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!elementRef.current) return;
    
    setIsMoving(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = customX || 0;
    const startTop = customY || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newX = startLeft + deltaX;
      const newY = startTop + deltaY;

      // Apply to element immediately for visual feedback
      if (elementRef.current) {
        elementRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }

      // Update block data
      updateBlockData(moduleId, blockId, { 
        customX: newX,
        customY: newY 
      });
    };

    const handleMouseUp = () => {
      setIsMoving(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "move";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!editMode) {
    // Apply custom styles even when not in edit mode
    const customStyles: React.CSSProperties = {
      overflow: 'hidden',
    };
    if (customWidth) customStyles.width = `${customWidth}px`;
    if (customHeight) customStyles.height = `${customHeight}px`;
    if (customX || customY) customStyles.transform = `translate(${customX || 0}px, ${customY || 0}px)`;

    // Content wrapper styles for text/image adaptation
    const contentWrapperClass = cn(
      "w-full h-full",
      isText && "overflow-hidden [&>*]:w-full [&>*]:h-full [&>*]:overflow-hidden [&>*]:text-ellipsis",
      blockType === "image" && "[&_img]:w-full [&_img]:h-full [&_img]:object-cover"
    );

    return (
      <div style={customStyles} className={className}>
        <div className={contentWrapperClass}>
          {children}
        </div>
      </div>
    );
  }

  // Apply custom styles in edit mode
  const editStyles: React.CSSProperties = {
    overflow: 'hidden',
  };
  if (customWidth) editStyles.width = `${customWidth}px`;
  if (customHeight) editStyles.height = `${customHeight}px`;
  if (customX || customY) editStyles.transform = `translate(${customX || 0}px, ${customY || 0}px)`;

  return (
    <div
      ref={elementRef}
      style={editStyles}
      className={cn(
        "relative group transition-colors duration-150",
        isHovered && !isSelected && "outline outline-2 outline-dashed outline-primary/60",
        isSelected && "outline outline-2 outline-primary outline-offset-1",
        isDragging && "opacity-50",
        (isResizing || isMoving) && "z-50",
        editMode && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={editMode && !isEditing && !isResizing && !isMoving}
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
      {isSelected && !isResizing && !isMoving && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-card rounded-lg shadow-xl border border-border px-2 py-1">
          {/* Move Handle - for repositioning */}
          <div 
            className="cursor-move p-1.5 hover:bg-muted rounded"
            title="Mover elemento"
            onMouseDown={handleMoveStart}
          >
            <Move className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Drag Handle - for reordering */}
          <div 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-muted rounded"
            title="Reordenar"
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

      {/* Resize Handles - for ALL block types when selected */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div 
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nw-resize border-2 border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div 
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-ne-resize border-2 border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div 
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-sw-resize border-2 border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div 
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          
          {/* Edge handles */}
          <div 
            className="absolute top-1/2 -left-1.5 w-2 h-6 -translate-y-1/2 bg-primary rounded cursor-w-resize border border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div 
            className="absolute top-1/2 -right-1.5 w-2 h-6 -translate-y-1/2 bg-primary rounded cursor-e-resize border border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div 
            className="absolute -top-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-primary rounded cursor-n-resize border border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div 
            className="absolute -bottom-1.5 left-1/2 w-6 h-2 -translate-x-1/2 bg-primary rounded cursor-s-resize border border-background shadow-sm z-50"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
        </>
      )}

      {/* Content wrapper for proper sizing adaptation */}
      <div className={cn(
        "w-full h-full",
        isText && "overflow-hidden [&>*]:w-full [&>*]:h-full [&>*]:overflow-hidden",
        blockType === "image" && "[&_img]:w-full [&_img]:h-full [&_img]:object-cover"
      )}>
        {/* Editable text content */}
        {isText && isEditing ? (
          <div
            contentEditable
            suppressContentEditableWarning
            className="outline-none bg-primary/10 min-h-[1em] p-1 -m-1 rounded w-full h-full overflow-auto"
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
    </div>
  );
};

export default EditableBlock;
