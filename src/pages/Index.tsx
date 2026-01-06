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
  return (
    <>
      {/* Mobile Layout */}
      <div data-layout="mobile" className="min-h-screen bg-background md:hidden">
        <Header />
        <main className="pt-14 pb-28">
          <HeroCarousel />
          <TunnelCard />
          <TicketCard />
          <QuizCard />
          <FanatiClassCard />
          <RadioCard />
        </main>
        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div data-layout="desktop" className="hidden min-h-screen bg-[hsl(var(--desktop-bg))] md:block">
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
    </>
  );
};

export default Index;

