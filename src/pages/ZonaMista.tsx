import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DesktopHeader from "@/components/desktop/DesktopHeader";
import DesktopFooter from "@/components/desktop/DesktopFooter";

// Dados de exemplo para as notícias
const newsData = [
  {
    id: 1,
    title: "Como lidar com a ansiedade antes de jogos decisivos",
    excerpt: "Descubra técnicas práticas para controlar a ansiedade e aproveitar melhor os momentos de tensão no futebol.",
    category: "Saúde Mental",
    date: "2025-01-28",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop",
    featured: true,
  },
  {
    id: 2,
    title: "A importância do apoio familiar para o torcedor",
    excerpt: "Entenda como o suporte da família pode fazer diferença na forma como vivenciamos as emoções do futebol.",
    category: "Família",
    date: "2025-01-26",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Rebaixamento: como superar a dor da queda",
    excerpt: "Psicólogos especializados explicam como processar o luto esportivo e seguir em frente após um rebaixamento.",
    category: "Superação",
    date: "2025-01-24",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop",
    featured: false,
  },
  {
    id: 4,
    title: "Violência nos estádios: um problema de saúde pública",
    excerpt: "Análise sobre as causas da violência e como a saúde mental pode ajudar a combater esse problema.",
    category: "Sociedade",
    date: "2025-01-22",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop",
    featured: false,
  },
  {
    id: 5,
    title: "Mindfulness para torcedores: pratique durante os jogos",
    excerpt: "Aprenda técnicas de atenção plena que podem ser aplicadas enquanto você assiste às partidas.",
    category: "Práticas",
    date: "2025-01-20",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop",
    featured: false,
  },
  {
    id: 6,
    title: "O papel das redes sociais na saúde mental do torcedor",
    excerpt: "Como o uso excessivo de redes sociais pode afetar nossa relação emocional com o time.",
    category: "Digital",
    date: "2025-01-18",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=500&fit=crop",
    featured: false,
  },
];

const categories = ["Todos", "Saúde Mental", "Família", "Superação", "Sociedade", "Práticas", "Digital"];

const ZonaMista = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredNews = newsData.filter((news) => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || news.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredNews = filteredNews.find((news) => news.featured);
  const regularNews = filteredNews.filter((news) => !news.featured);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DesktopHeader />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <h1 
            className="text-4xl lg:text-5xl text-white font-bold mb-4"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            Zona <span className="text-[var(--club-600)]">Mista</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Notícias, artigos e reflexões sobre saúde mental no universo do futebol. 
            Conteúdo criado por especialistas para ajudar você a viver sua paixão de forma saudável.
          </p>
        </section>

        {/* Search and Filters */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-[var(--club-600)]"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-[var(--club-600)] text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredNews && (
          <section className="max-w-7xl mx-auto px-6 mb-16">
            <Link to={`/zona-mista/${featuredNews.id}`} className="group">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="w-full h-[400px] lg:h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <Badge className="bg-[var(--club-600)] text-white mb-4">
                    {featuredNews.category}
                  </Badge>
                  <h2 
                    className="text-3xl lg:text-4xl text-white font-bold mb-4 group-hover:text-[var(--club-400)] transition-colors"
                    style={{ fontFamily: "'Work Sans', sans-serif" }}
                  >
                    {featuredNews.title}
                  </h2>
                  <p className="text-gray-300 text-lg mb-4 max-w-3xl">
                    {featuredNews.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-gray-400">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredNews.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredNews.readTime} de leitura
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Articles Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-2xl text-white font-bold mb-8"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            Últimos Artigos
          </h2>
          
          {regularNews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularNews.map((news) => (
                <Link
                  key={news.id}
                  to={`/zona-mista/${news.id}`}
                  className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-[color:var(--club-600)]/50 transition-colors"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute top-4 left-4 bg-[color:var(--club-600)]/90 text-white">
                      {news.category}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 
                      className="text-xl text-white font-semibold mb-3 group-hover:text-[var(--club-400)] transition-colors line-clamp-2"
                      style={{ fontFamily: "'Work Sans', sans-serif" }}
                    >
                      {news.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {news.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(news.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {news.readTime}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                Nenhum artigo encontrado para os filtros selecionados.
              </p>
            </div>
          )}

          {/* Load More Button */}
          {regularNews.length > 0 && (
            <div className="text-center mt-12">
              <button className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--club-600)] hover:bg-[var(--club-700)] text-white font-medium rounded-full transition-colors">
                Carregar mais artigos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </main>

      <DesktopFooter />
    </div>
  );
};

export default ZonaMista;
