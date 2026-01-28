import DesktopHeader from "@/components/desktop/DesktopHeader";
import DesktopHeroCarousel from "@/components/desktop/DesktopHeroCarousel";
import DesktopFeatures from "@/components/desktop/DesktopFeatures";
import DesktopCuriosities from "@/components/desktop/DesktopCuriosities";
import DesktopAbout from "@/components/desktop/DesktopAbout";
import DesktopTestimonials from "@/components/desktop/DesktopTestimonials";
import DesktopProfessionalForm from "@/components/desktop/DesktopProfessionalForm";
import DesktopFooter from "@/components/desktop/DesktopFooter";

/**
 * Static desktop view for the Content Manager.
 * Renders the actual desktop home components including header.
 */
const StaticDesktopView = () => {
  return (
    <div className="bg-[#0a0a0a]">
      {/* Header */}
      <DesktopHeader />
      
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
