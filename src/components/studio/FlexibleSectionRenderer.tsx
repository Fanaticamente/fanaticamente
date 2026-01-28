interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "button" | "spacer";
  content?: string;
  level?: "h1" | "h2" | "h3";
  alignment?: "left" | "center" | "right";
  imageUrl?: string;
  altText?: string;
  label?: string;
  link?: string;
  height?: number;
}

interface FlexibleSectionConfig {
  title?: string;
  subtitle?: string;
  blocks?: ContentBlock[];
  alignment?: string;
}

interface FlexibleSectionRendererProps {
  config: Record<string, unknown>;
}

const FlexibleSectionRenderer = ({ config }: FlexibleSectionRendererProps) => {
  const sectionConfig = config as FlexibleSectionConfig;
  const blocks = sectionConfig.blocks || [];
  const alignment = sectionConfig.alignment || "center";

  const getAlignmentClass = (blockAlignment?: string) => {
    const align = blockAlignment || alignment;
    switch (align) {
      case "left":
        return "text-left";
      case "right":
        return "text-right";
      default:
        return "text-center";
    }
  };

  const getJustifyClass = (blockAlignment?: string) => {
    const align = blockAlignment || alignment;
    switch (align) {
      case "left":
        return "justify-start";
      case "right":
        return "justify-end";
      default:
        return "justify-center";
    }
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = block.level || "h2";
        const headingSizes = {
          h1: "text-4xl md:text-5xl font-bold",
          h2: "text-3xl md:text-4xl font-bold",
          h3: "text-2xl md:text-3xl font-semibold",
        };
        return (
          <HeadingTag
            key={block.id}
            className={`text-white ${headingSizes[HeadingTag]} ${getAlignmentClass(block.alignment)}`}
          >
            {block.content}
          </HeadingTag>
        );

      case "text":
        return (
          <p
            key={block.id}
            className={`text-gray-300 text-lg leading-relaxed ${getAlignmentClass(block.alignment)}`}
          >
            {block.content}
          </p>
        );

      case "image":
        return (
          <div key={block.id} className={`flex ${getJustifyClass(block.alignment)}`}>
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt={block.altText || ""}
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Imagem não definida</span>
              </div>
            )}
          </div>
        );

      case "button":
        return (
          <div key={block.id} className={`flex ${getJustifyClass(block.alignment)}`}>
            <a
              href={block.link || "#"}
              className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors"
            >
              {block.label || "Clique aqui"}
            </a>
          </div>
        );

      case "spacer":
        return (
          <div
            key={block.id}
            style={{ height: `${block.height || 32}px` }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Legacy title/subtitle support */}
        {sectionConfig.title && (
          <h2 className={`text-3xl md:text-4xl font-bold text-white ${getAlignmentClass()}`}>
            {sectionConfig.title}
          </h2>
        )}
        {sectionConfig.subtitle && (
          <p className={`text-gray-400 text-lg ${getAlignmentClass()}`}>
            {sectionConfig.subtitle}
          </p>
        )}

        {/* Render blocks */}
        {blocks.map((block) => renderBlock(block))}
      </div>
    </section>
  );
};

export default FlexibleSectionRenderer;
