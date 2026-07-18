import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

// Mobile Components
import BottomNav from "@/components/layout/BottomNav";
import MinimalHome from "@/components/home/MinimalHome";
import HomeFloatingActions from "@/components/home/HomeFloatingActions";

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

  useEffect(() => {
    if (!isMobile) return;
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#ffffff";
    document.body.style.backgroundColor = "#ffffff";
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, [isMobile]);

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen bg-white font-sans">
          <HomeFloatingActions />
          <main className="pt-[calc(env(safe-area-inset-top)+72px)] px-4">
            <MinimalHome />
            <div aria-hidden className="h-24" />
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
