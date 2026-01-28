import { useAppModules } from "@/hooks/useAppModules";
import Header from "@/components/layout/Header";
import HeroCarousel from "@/components/home/HeroCarousel";
import TunnelCard from "@/components/home/TunnelCard";
import TicketCard from "@/components/home/TicketCard";
import QuizCard from "@/components/home/QuizCard";
import RadioCard from "@/components/home/RadioCard";
import FanatiClassCard from "@/components/home/FanatiClassCard";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2 } from "lucide-react";

/**
 * Static mobile view for the Content Manager.
 * Renders the actual mobile home components without navigation/auth side effects.
 */
const StaticMobileView = () => {
  const { data: modules, isLoading } = useAppModules("home");

  // Check visibility of modules
  const isModuleVisible = (moduleId: string) => {
    const module = modules?.find(m => m.module_id === moduleId);
    return module?.is_visible !== false;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background relative">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="pb-28">
        {/* Hero Carousel */}
        {isModuleVisible("hero-carousel") && <HeroCarousel />}
        
        {/* Cards Section */}
        <div className="space-y-0">
          {isModuleVisible("tunnel-access") && <TunnelCard />}
          {isModuleVisible("ticket-card") && <TicketCard />}
          {isModuleVisible("quiz-card") && <QuizCard />}
          {isModuleVisible("radio-card") && <RadioCard />}
          {isModuleVisible("class-card") && <FanatiClassCard />}
        </div>
      </main>
      
      {/* Bottom Nav (visual only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
};

export default StaticMobileView;
