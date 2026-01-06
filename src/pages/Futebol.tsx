import { Clock, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  category: string;
  image: string;
}

const news: NewsItem[] = [
  {
    id: 1,
    title: "Flamengo anuncia reforço para a temporada 2025",
    source: "GE",
    time: "Há 30 min",
    category: "Brasileiro",
    image: "⚽",
  },
  {
    id: 2,
    title: "Palmeiras fecha acordo milionário com novo patrocinador",
    source: "ESPN",
    time: "Há 1 hora",
    category: "Brasileiro",
    image: "💰",
  },
  {
    id: 3,
    title: "Libertadores 2025: sorteio define grupos da competição",
    source: "UOL",
    time: "Há 2 horas",
    category: "Libertadores",
    image: "🏆",
  },
  {
    id: 4,
    title: "Corinthians anuncia novo técnico para próxima temporada",
    source: "TNT Sports",
    time: "Há 3 horas",
    category: "Brasileiro",
    image: "📋",
  },
  {
    id: 5,
    title: "Copa Sul-Americana: brasileiros descobrem adversários",
    source: "GE",
    time: "Há 4 horas",
    category: "Sul-Americana",
    image: "🌎",
  },
  {
    id: 6,
    title: "Seleção Brasileira: Dorival convoca jogadores para amistosos",
    source: "CBF",
    time: "Há 5 horas",
    category: "Seleção",
    image: "🇧🇷",
  },
  {
    id: 7,
    title: "São Paulo fecha venda de destaque para clube europeu",
    source: "Gazeta",
    time: "Há 6 horas",
    category: "Transferências",
    image: "✈️",
  },
  {
    id: 8,
    title: "Brasileirão 2025: tabela completa é divulgada pela CBF",
    source: "GE",
    time: "Há 8 horas",
    category: "Brasileiro",
    image: "📅",
  },
];

const categories = ["Todos", "Brasileiro", "Libertadores", "Sul-Americana", "Seleção", "Transferências"];

const Futebol = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24">
        {/* Header */}
        <div className="px-4 mb-6">
          <h1 className="font-display text-4xl text-primary mb-2">
            Notícias
          </h1>
          <p className="text-muted-foreground">
            Tudo sobre futebol brasileiro e sul-americano
          </p>
        </div>

        {/* Categories */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat, index) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  index === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-card-foreground hover:border-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured News */}
        <div className="px-4 mb-6">
          <div className="bg-secondary rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase mb-3">
              Destaque
            </span>
            <h2 className="font-display text-2xl text-secondary-foreground mb-2">
              {news[0].title}
            </h2>
            <div className="flex items-center gap-3 text-secondary-foreground/70 text-sm">
              <span>{news[0].source}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {news[0].time}
              </span>
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="px-4">
          <h3 className="font-display text-xl text-card-foreground mb-4">
            Últimas Notícias
          </h3>

          <div className="space-y-3">
            {news.slice(1).map((item) => (
              <button
                key={item.id}
                className="w-full text-left bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
                  {item.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-card-foreground text-sm line-clamp-2 mb-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded">
                      {item.category}
                    </span>
                    <span>{item.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-[calc(6.5rem+env(safe-area-inset-bottom))]" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Futebol;
