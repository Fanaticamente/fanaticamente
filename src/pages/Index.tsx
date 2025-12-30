import { useIsMobile } from "@/hooks/use-mobile";

// Mobile Components
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroCarousel from "@/components/home/HeroCarousel";
import TunnelCard from "@/components/home/TunnelCard";
import TicketCard from "@/components/home/TicketCard";
import QuizCard from "@/components/home/QuizCard";
import FanatiClassCard from "@/components/home/FanatiClassCard";
import RadioCard from "@/components/home/RadioCard";

// Desktop Components
import DesktopHeader from "@/components/desktop/DesktopHeader";
import DesktopHero from "@/components/desktop/DesktopHero";
import DesktopPartners from "@/components/desktop/DesktopPartners";
import DesktopServices from "@/components/desktop/DesktopServices";
import DesktopSpecialists from "@/components/desktop/DesktopSpecialists";
import DesktopTestimonials from "@/components/desktop/DesktopTestimonials";
import DesktopCTA from "@/components/desktop/DesktopCTA";
import DesktopFooter from "@/components/desktop/DesktopFooter";

const Index = () => {
  const isMobile = useIsMobile();

  // Show loading state while determining device type
  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14">
          <HeroCarousel />
          <TunnelCard />
          <TicketCard />
          <QuizCard />
          <FanatiClassCard />
          <RadioCard />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-[hsl(var(--desktop-bg))]">
      <DesktopHeader />
      <main className="pt-[72px]">
        <DesktopHero />
        <DesktopPartners />
        <DesktopServices />
        <DesktopSpecialists />
        <DesktopTestimonials />
        <DesktopCTA />
      </main>
      <DesktopFooter />
    </div>
  );
};

export default Index;
