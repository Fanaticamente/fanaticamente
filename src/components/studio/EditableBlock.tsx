import { useRef, useState, useEffect, ReactNode } from "react";
import { useVisualEditor } from "./VisualEditorContext";
import { Move, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableBlockProps {
  moduleId: string;
  blockId: string;
  blockType: string;
  blockData: Record<string, unknown>;
  children: ReactNode;
  className?: string;
  isText?: boolean;
}

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
  } = useVisualEditor();

  const elementRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(blockData.content as string || "");

  const elementKey = `${moduleId}:${blockId}`;
  const isSelected = selectedElement?.moduleId === moduleId && selectedElement?.blockId === blockId;
  const isHovered = hoveredElement === elementKey;

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
    if (editMode) {
      setHoveredElement(elementKey);
    }
  };

  const handleMouseLeave = () => {
    if (editMode) {
      setHoveredElement(null);
    }
  };

  if (!editMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative transition-all duration-150",
        isHovered && !isSelected && "outline outline-2 outline-dashed outline-blue-400/50",
        isSelected && "outline outline-2 outline-blue-500 outline-offset-2",
        editMode && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover/Selection Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-8 left-0 z-50 flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">
          <Move className="w-3 h-3" />
          <span className="capitalize">{blockType}</span>
          <Settings className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-200" />
        </div>
      )}

      {/* Resize handles for selected elements */}
      {isSelected && !isText && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
        </>
      )}

      {/* Editable text content */}
      {isText && isEditing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          className="outline-none bg-blue-500/10 min-h-[1em] p-1 -m-1"
          onBlur={handleBlur}
          onInput={(e) => setEditableContent(e.currentTarget.textContent || "")}
          dangerouslySetInnerHTML={{ __html: editableContent }}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      ) : (
        children
      )}
    </div>
  );
};

export default EditableBlock;
