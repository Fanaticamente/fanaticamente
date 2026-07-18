import { useIsMobile } from "@/hooks/use-mobile";

// Mobile Components
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MinimalHome from "@/components/home/MinimalHome";

// Desktop Components (Fanaticamente.com style)
import DesktopHeader from "@/components/desktop/DesktopHeader";
import DesktopHero from "@/components/desktop/DesktopHero";
import DesktopFeatures from "@/components/desktop/DesktopFeatures";
import DesktopCuriosities from "@/components/desktop/DesktopCuriosities";
import DesktopChampionship from "@/components/desktop/DesktopChampionship";
import DesktopAbout from "@/components/desktop/DesktopAbout";
import DesktopTestimonials from "@/components/desktop/DesktopTestimonials";
import DesktopProfessionalForm from "@/components/desktop/DesktopProfessionalForm";
import DesktopFooter from "@/components/desktop/DesktopFooter";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen bg-[#f7f8fa]">
          <Header />
          <main className="pt-16 px-4">
            <MinimalHome />
            <div aria-hidden className="h-28" />
          </main>
          <BottomNav />
        </div>
      ) : (
        <div className="min-h-screen bg-[#0a0a0a]">
          <DesktopHeader />
          <main className="pt-[72px]">
            <DesktopHero />
            <div id="funcionalidades">
              <DesktopFeatures />
            </div>
            <div id="curiosidades">
              <DesktopCuriosities />
            </div>
            <DesktopChampionship />
            <div id="sobre">
              <DesktopAbout />
            </div>
            <DesktopTestimonials />
            <div id="profissionais">
              <DesktopProfessionalForm />
            </div>
          </main>
          <DesktopFooter />
        </div>
      )}
    </>
  );
};

export default Index;
