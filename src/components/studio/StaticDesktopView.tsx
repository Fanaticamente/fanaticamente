import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";
import DesktopHeroCarousel from "@/components/desktop/DesktopHeroCarousel";
import DesktopFeatures from "@/components/desktop/DesktopFeatures";
import DesktopCuriosities from "@/components/desktop/DesktopCuriosities";
import DesktopAbout from "@/components/desktop/DesktopAbout";
import DesktopTestimonials from "@/components/desktop/DesktopTestimonials";
import DesktopProfessionalForm from "@/components/desktop/DesktopProfessionalForm";
import DesktopFooter from "@/components/desktop/DesktopFooter";

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
 * Static desktop view for the Content Manager.
 * Renders the actual desktop home components with a preview-compatible header.
 */
const StaticDesktopView = () => {
  return (
    <div className="bg-[#0a0a0a]">
      {/* Preview Header - sticky within container */}
      <PreviewHeader />
      
      {/* Hero Carousel */}
      <DesktopHeroCarousel />
      
      {/* Features Section */}
      <DesktopFeatures />
      
      {/* Curiosities Section */}
      <DesktopCuriosities />
      
      {/* About Section */}
      <DesktopAbout />
      
      {/* Testimonials Section */}
      <DesktopTestimonials />
      
      {/* Professional Form Section */}
      <div id="profissionais">
        <DesktopProfessionalForm />
      </div>
      
      {/* Footer */}
      <DesktopFooter />
    </div>
  );
};

export default StaticDesktopView;
