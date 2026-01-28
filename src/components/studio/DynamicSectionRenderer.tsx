import { useMemo } from "react";

// Configuration interfaces for dynamic sections
export interface TextBlock {
  id: string;
  type: "text";
  content: string;
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  alignment?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
  maxWidth?: string;
  // Rich text support - parts of text can be bold/italic
  richText?: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean }>;
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  content: string;
  level?: 1 | 2 | 3 | 4;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  alignment?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
}

export interface ImageBlock {
  id: string;
  type: "image";
  src: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain" | "fill";
  alignment?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  // Negative margins for overlap effects
  negativeMarginTop?: number;
  negativeMarginLeft?: number;
  negativeMarginRight?: number;
}

export interface SpacerBlock {
  id: string;
  type: "spacer";
  height: number;
}

export interface ButtonBlock {
  id: string;
  type: "button";
  label: string;
  link?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  alignment?: "left" | "center" | "right";
}

export type ContentBlock = TextBlock | HeadingBlock | ImageBlock | SpacerBlock | ButtonBlock;

export interface ColumnConfig {
  blocks: ContentBlock[];
  alignment?: "start" | "center" | "end";
  verticalAlignment?: "start" | "center" | "end";
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface DynamicSectionConfig {
  // Layout
  layoutType: "single" | "two-column" | "left-wide" | "right-wide";
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  marginTop?: number; // Can be negative for overlap
  marginBottom?: number;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl";
  overflow?: "hidden" | "visible";
  
  // Columns
  leftColumn?: ColumnConfig;
  rightColumn?: ColumnConfig;
  singleColumn?: ColumnConfig;
  
  // Gap between columns
  columnGap?: number;
}

interface DynamicSectionRendererProps {
  config: DynamicSectionConfig;
  moduleId?: string;
}

const DynamicSectionRenderer = ({ config, moduleId }: DynamicSectionRendererProps) => {
  const {
    layoutType = "single",
    backgroundColor = "#ffffff",
    paddingTop = 80,
    paddingBottom = 80,
    marginTop = 0,
    marginBottom = 0,
    maxWidth = "7xl",
    overflow = "hidden",
    leftColumn,
    rightColumn,
    singleColumn,
    columnGap = 64,
  } = config;

  const maxWidthClass = useMemo(() => {
    switch (maxWidth) {
      case "full": return "max-w-full";
      case "7xl": return "max-w-7xl";
      case "6xl": return "max-w-6xl";
      case "5xl": return "max-w-5xl";
      case "4xl": return "max-w-4xl";
      default: return "max-w-7xl";
    }
  }, [maxWidth]);

  const gridClass = useMemo(() => {
    switch (layoutType) {
      case "two-column": return "grid-cols-1 lg:grid-cols-2";
      case "left-wide": return "grid-cols-1 lg:grid-cols-[2fr_1fr]";
      case "right-wide": return "grid-cols-1 lg:grid-cols-[1fr_2fr]";
      default: return "";
    }
  }, [layoutType]);

  const renderRichText = (block: TextBlock) => {
    if (block.richText && block.richText.length > 0) {
      return block.richText.map((part, idx) => {
        let element = <span key={idx}>{part.text}</span>;
        if (part.bold) {
          element = <span key={idx} className="font-bold">{part.text}</span>;
        }
        if (part.italic) {
          element = <span key={idx} className="italic">{part.text}</span>;
        }
        if (part.underline) {
          element = <span key={idx} className="underline">{part.text}</span>;
        }
        if (part.bold && part.italic) {
          element = <span key={idx} className="font-bold italic">{part.text}</span>;
        }
        return element;
      });
    }
    
    // Parse markdown-style bold (**text**) in content
    const parts = block.content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={idx} className="font-bold">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  const renderBlock = (block: ContentBlock) => {
    const baseStyle: React.CSSProperties = {};
    
    if ('marginTop' in block && block.marginTop) baseStyle.marginTop = `${block.marginTop}px`;
    if ('marginBottom' in block && block.marginBottom) baseStyle.marginBottom = `${block.marginBottom}px`;
    if ('marginLeft' in block && block.marginLeft) baseStyle.marginLeft = `${block.marginLeft}px`;
    if ('marginRight' in block && block.marginRight) baseStyle.marginRight = `${block.marginRight}px`;
    
    // Handle negative margins for overlap effects
    if (block.type === 'image') {
      if (block.negativeMarginTop) baseStyle.marginTop = `-${block.negativeMarginTop}px`;
      if (block.negativeMarginLeft) baseStyle.marginLeft = `-${block.negativeMarginLeft}px`;
      if (block.negativeMarginRight) baseStyle.marginRight = `-${block.negativeMarginRight}px`;
    }

    switch (block.type) {
      case "heading": {
        const sizeClasses: Record<number, string> = {
          1: "text-5xl lg:text-6xl",
          2: "text-4xl lg:text-5xl",
          3: "text-2xl lg:text-3xl",
          4: "text-xl lg:text-2xl",
        };
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        const alignmentClass = block.alignment === 'right' ? 'text-right' : block.alignment === 'center' ? 'text-center' : 'text-left';
        const weightClass = block.fontWeight === 'bold' ? 'font-bold' : block.fontWeight === 'semibold' ? 'font-semibold' : block.fontWeight === 'medium' ? 'font-medium' : 'font-normal';
        
        return (
          <HeadingTag
            key={block.id}
            className={`${sizeClasses[block.level || 2]} ${weightClass} ${alignmentClass}`}
            style={{ 
              ...baseStyle, 
              color: block.color || '#000000',
              fontFamily: "'Work Sans', sans-serif"
            }}
          >
            {block.content}
          </HeadingTag>
        );
      }

      case "text": {
        const sizeClasses: Record<string, string> = {
          sm: "text-sm",
          base: "text-base",
          lg: "text-lg",
          xl: "text-xl",
          "2xl": "text-2xl",
          "3xl": "text-3xl",
          "4xl": "text-4xl",
          "5xl": "text-5xl",
        };
        const alignmentClass = block.alignment === 'right' ? 'text-right' : block.alignment === 'center' ? 'text-center' : 'text-left';
        const weightClass = block.fontWeight === 'bold' ? 'font-bold' : block.fontWeight === 'semibold' ? 'font-semibold' : block.fontWeight === 'medium' ? 'font-medium' : 'font-normal';
        
        return (
          <p
            key={block.id}
            className={`${sizeClasses[block.fontSize || 'base']} ${weightClass} ${alignmentClass} leading-relaxed`}
            style={{ 
              ...baseStyle, 
              color: block.color || '#374151',
              maxWidth: block.maxWidth || undefined
            }}
          >
            {renderRichText(block)}
          </p>
        );
      }

      case "image": {
        const alignmentClass = block.alignment === 'right' ? 'justify-end' : block.alignment === 'center' ? 'justify-center' : 'justify-start';
        
        return (
          <div key={block.id} className={`flex ${alignmentClass}`} style={baseStyle}>
            <img
              src={block.src}
              alt={block.alt || ''}
              className="object-contain max-w-none"
              style={{
                width: block.width || 'auto',
                height: block.height || 'auto',
                objectFit: block.objectFit || 'contain',
              }}
            />
          </div>
        );
      }

      case "spacer":
        return <div key={block.id} style={{ height: `${block.height}px` }} />;

      case "button": {
        const alignmentClass = block.alignment === 'right' ? 'justify-end' : block.alignment === 'center' ? 'justify-center' : 'justify-start';
        const variantClasses: Record<string, string> = {
          primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
          secondary: "bg-gray-800 hover:bg-gray-700 text-white",
          outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white",
          ghost: "text-emerald-600 hover:bg-emerald-50",
        };
        
        return (
          <div key={block.id} className={`flex ${alignmentClass}`} style={baseStyle}>
            <a
              href={block.link || '#'}
              className={`inline-flex items-center justify-center px-8 py-3 rounded-full font-medium transition-colors ${variantClasses[block.variant || 'primary']}`}
            >
              {block.label}
            </a>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const renderColumn = (column: ColumnConfig | undefined) => {
    if (!column) return null;

    const alignmentClass = column.alignment === 'end' ? 'items-end' : column.alignment === 'center' ? 'items-center' : 'items-start';
    const verticalAlignmentClass = column.verticalAlignment === 'end' ? 'justify-end' : column.verticalAlignment === 'center' ? 'justify-center' : 'justify-start';

    return (
      <div
        className={`flex flex-col ${alignmentClass} ${verticalAlignmentClass}`}
        style={{
          paddingLeft: column.paddingLeft ? `${column.paddingLeft}px` : undefined,
          paddingRight: column.paddingRight ? `${column.paddingRight}px` : undefined,
          paddingTop: column.paddingTop ? `${column.paddingTop}px` : undefined,
          paddingBottom: column.paddingBottom ? `${column.paddingBottom}px` : undefined,
        }}
      >
        {column.blocks.map(renderBlock)}
      </div>
    );
  };

  return (
    <section
      style={{
        backgroundColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: marginTop ? `${marginTop}px` : undefined,
        marginBottom: marginBottom ? `${marginBottom}px` : undefined,
        overflow,
      }}
    >
      <div className={`${maxWidthClass} mx-auto px-6 lg:px-12`}>
        {layoutType === "single" ? (
          renderColumn(singleColumn)
        ) : (
          <div 
            className={`grid ${gridClass} items-center`}
            style={{ gap: `${columnGap}px` }}
          >
            {renderColumn(leftColumn)}
            {renderColumn(rightColumn)}
          </div>
        )}
      </div>
    </section>
  );
};

export default DynamicSectionRenderer;
