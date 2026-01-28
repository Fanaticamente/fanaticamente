import EditableBlock from "./EditableBlock";
import { useVisualEditor } from "./VisualEditorContext";

interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "button" | "spacer" | "card";
  content?: string;
  level?: number;
  alignment?: "left" | "center" | "right";
  src?: string;
  imageUrl?: string;
  alt?: string;
  altText?: string;
  label?: string;
  link?: string;
  height?: number;
  width?: "full" | "2/3" | "1/2" | "1/3";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textColor?: "white" | "gray" | "muted" | "accent";
  backgroundColor?: string;
  column?: "left" | "right" | "full";
  padding?: "none" | "small" | "medium" | "large";
}

interface SectionLayout {
  type: "single" | "two-column" | "left-wide" | "right-wide";
  backgroundColor?: string;
  containerWidth?: "full" | "narrow" | "wide";
  verticalPadding?: "small" | "medium" | "large";
}

interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface TestimonialItem {
  name: string;
  role?: string;
  club?: string;
  text: string;
  avatar?: string;
}

interface FlexibleSectionConfig {
  title?: string;
  subtitle?: string;
  content?: string;
  blocks?: ContentBlock[];
  layout?: SectionLayout;
  items?: FeatureItem[];
  testimonials?: TestimonialItem[];
  alignment?: string;
  backgroundImage?: string;
  cta?: string;
  ctaLink?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  image?: string;
  caption?: string;
  description?: string;
  members?: Array<{ name: string; role: string; image?: string; bio?: string }>;
  images?: string[];
  columns?: number;
  fields?: string[];
}

interface FlexibleSectionRendererProps {
  config: Record<string, unknown>;
  name?: string;
  moduleType?: string;
  moduleId?: string;
}

// Try to use the visual editor context, but provide fallback if not available
const useVisualEditorSafe = () => {
  try {
    return useVisualEditor();
  } catch {
    return { editMode: false };
  }
};

const FlexibleSectionRenderer = ({ config, name, moduleType, moduleId }: FlexibleSectionRendererProps) => {
  const sectionConfig = config as FlexibleSectionConfig;
  const blocks = sectionConfig.blocks || [];
  const layout = sectionConfig.layout || { type: "single", backgroundColor: "#0a0a0a", verticalPadding: "medium" };
  const alignment = sectionConfig.alignment || "center";
  const { editMode } = useVisualEditorSafe();

  const getTextColorClass = (color?: string) => {
    switch (color) {
      case "white": return "text-white";
      case "gray": return "text-gray-300";
      case "muted": return "text-gray-500";
      case "accent": return "text-emerald-400";
      default: return "text-white";
    }
  };

  const getFontWeightClass = (weight?: string) => {
    switch (weight) {
      case "normal": return "font-normal";
      case "medium": return "font-medium";
      case "semibold": return "font-semibold";
      case "bold": return "font-bold";
      default: return "font-normal";
    }
  };

  const getAlignmentClass = (blockAlignment?: string) => {
    const align = blockAlignment || alignment;
    switch (align) {
      case "left": return "text-left";
      case "right": return "text-right";
      default: return "text-center";
    }
  };

  const getJustifyClass = (blockAlignment?: string) => {
    const align = blockAlignment || alignment;
    switch (align) {
      case "left": return "justify-start";
      case "right": return "justify-end";
      default: return "justify-center";
    }
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case "full": return "w-full";
      case "2/3": return "w-2/3";
      case "1/2": return "w-1/2";
      case "1/3": return "w-1/3";
      default: return "w-full";
    }
  };

  const getPaddingClass = (padding?: string) => {
    switch (padding) {
      case "none": return "";
      case "small": return "p-4";
      case "medium": return "p-6 md:p-8";
      case "large": return "p-8 md:p-12";
      default: return "p-6";
    }
  };

  const getVerticalPadding = (vp?: string) => {
    switch (vp) {
      case "small": return "py-10";
      case "medium": return "py-16 md:py-20";
      case "large": return "py-24 md:py-32";
      default: return "py-16";
    }
  };

  const wrapWithEditable = (block: ContentBlock, content: React.ReactNode, isText = false) => {
    if (!editMode || !moduleId) return content;
    
    return (
      <EditableBlock
        key={block.id}
        moduleId={moduleId}
        blockId={block.id}
        blockType={block.type}
        blockData={block as unknown as Record<string, unknown>}
        isText={isText}
      >
        {content}
      </EditableBlock>
    );
  };

  const renderBlock = (block: ContentBlock) => {
    const imgSrc = block.src || block.imageUrl;
    const imgAlt = block.alt || block.altText || "";
    const buttonLabel = block.content || block.label || "Clique aqui";

    switch (block.type) {
      case "heading": {
        const level = block.level || 2;
        const headingSizes: Record<number, string> = {
          1: "text-4xl md:text-5xl lg:text-6xl",
          2: "text-3xl md:text-4xl lg:text-5xl",
          3: "text-2xl md:text-3xl",
        };
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        const headingContent = (
          <HeadingTag
            className={`${headingSizes[level]} ${getFontWeightClass(block.fontWeight)} ${getTextColorClass(block.textColor)} ${getAlignmentClass(block.alignment)} leading-tight`}
          >
            {block.content}
          </HeadingTag>
        );
        return wrapWithEditable(block, headingContent, true);
      }

      case "text": {
        const textContent = (
          <p
            className={`text-lg md:text-xl leading-relaxed ${getFontWeightClass(block.fontWeight)} ${getTextColorClass(block.textColor)} ${getAlignmentClass(block.alignment)}`}
          >
            {block.content}
          </p>
        );
        return wrapWithEditable(block, textContent, true);
      }

      case "card": {
        const isLightBg = block.backgroundColor === "#f5f5f5" || block.backgroundColor === "transparent";
        const cardTextColor = isLightBg ? "text-gray-800" : "text-white";
        const cardContent = (
          <div 
            className={`rounded-xl ${getPaddingClass(block.padding)} ${getAlignmentClass(block.alignment)}`}
            style={{ backgroundColor: block.backgroundColor || "#f5f5f5" }}
          >
            <div className={`space-y-3 ${cardTextColor}`}>
              {block.content?.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return (
                    <h3 key={i} className="text-xl md:text-2xl font-bold">
                      {line.replace('## ', '')}
                    </h3>
                  );
                }
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className={`text-base md:text-lg leading-relaxed ${isLightBg ? 'text-gray-600' : 'text-gray-300'}`}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className={isLightBg ? 'text-gray-900' : 'text-white'}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
          </div>
        );
        return wrapWithEditable(block, cardContent, false);
      }

      case "image": {
        const imageContent = (
          <div className={`flex ${getJustifyClass(block.alignment)}`}>
            <div className={getWidthClass(block.width)}>
              {imgSrc ? (
                <img src={imgSrc} alt={imgAlt} className="w-full h-auto rounded-lg" />
              ) : (
                <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Imagem não definida</span>
                </div>
              )}
            </div>
          </div>
        );
        return wrapWithEditable(block, imageContent, false);
      }

      case "button": {
        const buttonContent = (
          <div className={`flex ${getJustifyClass(block.alignment)}`}>
            <a
              href={block.link || "#"}
              className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors"
              onClick={editMode ? (e) => e.preventDefault() : undefined}
            >
              {buttonLabel}
            </a>
          </div>
        );
        return wrapWithEditable(block, buttonContent, false);
      }

      case "spacer": {
        const spacerContent = (
          <div style={{ height: `${block.height || 32}px` }} />
        );
        return wrapWithEditable(block, spacerContent, false);
      }

      default:
        return null;
    }
  };

  // Render hero section
  if (moduleType === "hero") {
    return (
      <section 
        className="relative min-h-[60vh] flex items-center justify-center py-20 px-6"
        style={sectionConfig.backgroundImage ? { 
          backgroundImage: `url(${sectionConfig.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {sectionConfig.backgroundImage && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {sectionConfig.title && (
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {sectionConfig.title}
            </h1>
          )}
          {sectionConfig.subtitle && (
            <p className="text-xl text-gray-300 mb-8">
              {sectionConfig.subtitle}
            </p>
          )}
          {sectionConfig.cta && (
            <a 
              href={sectionConfig.ctaLink || "#"} 
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors"
            >
              {sectionConfig.cta}
            </a>
          )}
        </div>
      </section>
    );
  }

  // Render CTA section
  if (moduleType === "cta") {
    return (
      <section 
        className="py-20 px-6"
        style={{ backgroundColor: sectionConfig.backgroundColor || '#10b981' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {sectionConfig.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {sectionConfig.title}
            </h2>
          )}
          {sectionConfig.subtitle && (
            <p className="text-xl text-white/80 mb-8">
              {sectionConfig.subtitle}
            </p>
          )}
          {sectionConfig.buttonText && (
            <a 
              href={sectionConfig.buttonLink || "#"} 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 font-medium rounded-full hover:bg-gray-100 transition-colors"
            >
              {sectionConfig.buttonText}
            </a>
          )}
        </div>
      </section>
    );
  }

  // Render image section
  if (moduleType === "image_section") {
    return (
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {sectionConfig.image ? (
            <img
              src={sectionConfig.image}
              alt={sectionConfig.caption || ""}
              className="w-full h-auto rounded-xl"
            />
          ) : (
            <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center">
              <span className="text-gray-500">Imagem não definida</span>
            </div>
          )}
          {sectionConfig.caption && (
            <p className="text-center text-gray-400 mt-4">{sectionConfig.caption}</p>
          )}
        </div>
      </section>
    );
  }

  // Render features/cards section
  if (moduleType === "features" && sectionConfig.items) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {sectionConfig.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {sectionConfig.title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sectionConfig.items.map((item, index) => (
              <div key={index} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Render testimonials section
  if (moduleType === "testimonials" && sectionConfig.testimonials) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {sectionConfig.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {sectionConfig.title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sectionConfig.testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <p className="text-gray-300 italic mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  {testimonial.avatar && (
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <p className="text-white font-medium">{testimonial.name}</p>
                    {(testimonial.role || testimonial.club) && (
                      <p className="text-gray-500 text-sm">{testimonial.role || testimonial.club}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Render team section
  if (moduleType === "team" && sectionConfig.members) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {sectionConfig.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {sectionConfig.title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sectionConfig.members.map((member, index) => (
              <div key={index} className="text-center">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-800 mx-auto mb-4" />
                )}
                <h3 className="text-white font-medium">{member.name}</h3>
                <p className="text-gray-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Render gallery section
  if (moduleType === "gallery" && sectionConfig.images) {
    const columns = sectionConfig.columns || 3;
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {sectionConfig.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {sectionConfig.title}
            </h2>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
            {sectionConfig.images.map((image, index) => (
              <img key={index} src={image} alt="" className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: render section with layout support
  // For multi-column layouts, blocks without explicit column default to "left"
  const leftBlocks = blocks.filter(b => b.column === "left" || (!b.column && layout.type !== "single"));
  const rightBlocks = blocks.filter(b => b.column === "right");
  const fullBlocks = blocks.filter(b => b.column === "full");

  const singleColumnBlocks = layout.type === "single" ? blocks : [];

  const getGridClass = () => {
    switch (layout.type) {
      case "two-column": return "grid-cols-1 md:grid-cols-2";
      case "left-wide": return "grid-cols-1 md:grid-cols-[2fr_1fr]";
      case "right-wide": return "grid-cols-1 md:grid-cols-[1fr_2fr]";
      default: return "";
    }
  };

  const getContainerWidth = () => {
    switch (layout.containerWidth) {
      case "narrow": return "max-w-4xl";
      case "full": return "max-w-full px-0";
      default: return "max-w-6xl";
    }
  };

  return (
    <section
      className={`${getVerticalPadding(layout.verticalPadding)} px-6`}
      style={{ backgroundColor: layout.backgroundColor || "transparent" }}
    >
      <div className={`${getContainerWidth()} mx-auto`}>
        {layout.type === "single" ? (
          <div className="space-y-6">
            {singleColumnBlocks.map(renderBlock)}
          </div>
        ) : (
          <>
            {fullBlocks.length > 0 && (
              <div className="space-y-6 mb-8">
                {fullBlocks.map(renderBlock)}
              </div>
            )}
            <div className={`grid ${getGridClass()} gap-8`}>
              <div className="space-y-6">
                {leftBlocks.map(renderBlock)}
              </div>
              <div className="space-y-6">
                {rightBlocks.map(renderBlock)}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FlexibleSectionRenderer;
