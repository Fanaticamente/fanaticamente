import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroCarousel from "@/components/home/HeroCarousel";
import TunnelCard from "@/components/home/TunnelCard";
import TicketCard from "@/components/home/TicketCard";
import QuizCard from "@/components/home/QuizCard";
import FanatiClassCard from "@/components/home/FanatiClassCard";
import RadioCard from "@/components/home/RadioCard";

const Index = () => {
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
};

export default Index;
