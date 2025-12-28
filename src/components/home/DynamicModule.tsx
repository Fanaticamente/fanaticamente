import { AppModule, ModuleConfig } from "@/hooks/useAppModules";
import HeroCarousel from "./HeroCarousel";
import TunnelCard from "./TunnelCard";
import TicketCard from "./TicketCard";
import QuizCard from "./QuizCard";
import FanatiClassCard from "./FanatiClassCard";
import RadioCard from "./RadioCard";

interface DynamicModuleProps {
  module: AppModule;
}

const DynamicModule = ({ module }: DynamicModuleProps) => {
  if (!module.is_visible) return null;

  const config = module.config as ModuleConfig;

  switch (module.module_type) {
    case "carousel":
      return <HeroCarousel config={config} />;
    case "tunnel":
      return <TunnelCard config={config} />;
    case "ticket":
      return <TicketCard config={config} />;
    case "quiz":
      return <QuizCard config={config} />;
    case "class":
      return <FanatiClassCard config={config} />;
    case "radio":
      return <RadioCard config={config} />;
    default:
      return null;
  }
};

export default DynamicModule;
