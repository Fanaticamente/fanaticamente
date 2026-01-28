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

interface FAQItem {
  question: string;
  answer: string;
}

interface FlexibleSectionConfig {
  title?: string;
  subtitle?: string;
  content?: string;
  blocks?: ContentBlock[];
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
}

const FlexibleSectionRenderer = ({ config, name, moduleType }: FlexibleSectionRendererProps) => {
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

  // Default: render text section with blocks
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title from config */}
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
        
        {/* Legacy content support */}
        {sectionConfig.content && !blocks.length && (
          <p className={`text-gray-300 text-lg leading-relaxed ${getAlignmentClass()}`}>
            {sectionConfig.content}
          </p>
        )}

        {/* Description for about-type sections */}
        {sectionConfig.description && (
          <p className={`text-gray-300 text-lg leading-relaxed ${getAlignmentClass()}`}>
            {sectionConfig.description}
          </p>
        )}

        {/* Render blocks */}
        {blocks.map((block) => renderBlock(block))}

        {/* CTA button if present */}
        {(sectionConfig.buttonText || sectionConfig.cta) && (
          <div className={`flex ${getJustifyClass()} pt-4`}>
            <a
              href={sectionConfig.buttonLink || sectionConfig.ctaLink || "#"}
              className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors"
            >
              {sectionConfig.buttonText || sectionConfig.cta}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default FlexibleSectionRenderer;
