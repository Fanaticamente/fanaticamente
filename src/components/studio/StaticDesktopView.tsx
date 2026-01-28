import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";
import DesktopHeroCarousel from "@/components/desktop/DesktopHeroCarousel";
import DesktopFeatures from "@/components/desktop/DesktopFeatures";
import DesktopCuriosities from "@/components/desktop/DesktopCuriosities";
import DesktopAbout from "@/components/desktop/DesktopAbout";
import DesktopTestimonials from "@/components/desktop/DesktopTestimonials";
import DesktopProfessionalForm from "@/components/desktop/DesktopProfessionalForm";
import DesktopFooter from "@/components/desktop/DesktopFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import FlexibleSectionRenderer from "./FlexibleSectionRenderer";

interface ModuleConfig {
  id: string;
  module_id: string;
  module_type: string;
  name: string;
  is_visible: boolean;
  order_index: number;
  config: Record<string, unknown>;
}

/**
 * Preview-only header that uses sticky positioning instead of fixed.
 * This ensures it stays within the preview container.
 */
const PreviewHeader = () => {
  const navLinks = [
    { label: "Início", path: "/" },
    { label: "Especialistas", path: "/terapeutas" },
    { label: "OSMF", path: "/osmf" },
    { label: "Junte-se a nós", path: "#profissionais" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logoHeader} alt="Fanaticamente" className="h-10 w-auto" />
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <span
              key={link.path}
              className="text-gray-400 hover:text-white font-medium transition-colors px-2 cursor-pointer"
            >
              {link.label}
            </span>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10"
          >
            Entrar
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
          >
            Baixar App
          </Button>
        </div>
      </div>
    </header>
  );
};

/**
 * Renders a module based on its module_id or module_type
 */
const ModuleRenderer = ({ module }: { module: ModuleConfig }) => {
  if (!module.is_visible) return null;

  // First check for known static module IDs
  switch (module.module_id) {
    case "desktop_hero_carousel":
      return <DesktopHeroCarousel />;
    case "desktop_features_section":
      return <DesktopFeatures />;
    case "desktop_curiosities_section":
      return <DesktopCuriosities />;
    case "desktop_about_section":
      return <DesktopAbout />;
    case "desktop_testimonials_section":
      return <DesktopTestimonials />;
    case "desktop_professional_form":
      return (
        <div id="profissionais">
          <DesktopProfessionalForm />
        </div>
      );
    case "desktop_footer":
      return <DesktopFooter />;
  }

  // For dynamic sections created via the editor, render based on module_type
  const flexibleTypes = [
    "text_section",
    "flexible",
    "custom",
    "hero",
    "image_section",
    "features",
    "testimonials",
    "team",
    "gallery",
    "cta",
    "faq",
    "contact",
  ];

  if (flexibleTypes.includes(module.module_type)) {
    return (
      <FlexibleSectionRenderer 
        config={module.config} 
        name={module.name} 
        moduleType={module.module_type}
        moduleId={module.id}
      />
    );
  }

  return null;
};

/**
 * Dynamic desktop view for the Content Manager.
 * Reads modules from database and renders them in order.
 */
const StaticDesktopView = () => {
  const { data: modules, isLoading } = useQuery({
    queryKey: ["desktop-modules-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_modules")
        .select("*")
        .eq("page", "desktop")
        .eq("is_visible", true)
        .order("order_index");

      if (error) throw error;
      return data as unknown as ModuleConfig[];
    },
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a]">
      {/* Preview Header - sticky within container */}
      <PreviewHeader />
      
      {/* Dynamic Modules */}
      {modules?.map((module) => (
        <ModuleRenderer key={module.id} module={module} />
      ))}
      
      {/* Footer always at the end if not in modules */}
      {!modules?.some(m => m.module_id === "desktop_footer") && (
        <DesktopFooter />
      )}
    </div>
  );
};

export default StaticDesktopView;
