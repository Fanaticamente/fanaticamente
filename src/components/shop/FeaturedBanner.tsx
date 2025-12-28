import { brazilianClubs } from "@/data/brazilianClubs";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

interface FeaturedBannerProps {
  onSelectClub: (clubId: string) => void;
}

const FeaturedBanner = ({ onSelectClub }: FeaturedBannerProps) => {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  
  const featuredClubs = brazilianClubs
    .filter((club) => club.league === "serie_a")
    .slice(0, 5);

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      opts={{ loop: true }}
    >
      <CarouselContent>
        {featuredClubs.map((club) => (
          <CarouselItem key={club.id}>
            <div
              className="relative h-48 md:h-64 rounded-xl mx-4 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.primaryColor}dd 50%, ${club.secondaryColor || club.primaryColor}aa 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-between p-6">
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-medium mb-1">
                    LANÇAMENTO
                  </p>
                  <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">
                    Nova Camisa {club.name}
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    Temporada 2024 disponível
                  </p>
                  <Button
                    onClick={() => onSelectClub(club.id)}
                    className="bg-white text-zinc-900 hover:bg-zinc-200"
                  >
                    Ver Produtos
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img
                    src={club.badgeUrl}
                    alt={club.name}
                    className="w-32 h-32 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -right-5 top-0 w-20 h-20 rounded-full bg-white/5" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default FeaturedBanner;
