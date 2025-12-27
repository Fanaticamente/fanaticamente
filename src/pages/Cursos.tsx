import { useState } from "react";
import { Play, Star, Clock, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface Course {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  lessons: number;
  rating: number;
  thumbnail: string;
  isPremium: boolean;
  category: string;
  progress?: number;
  tag?: string;
  year: string;
  seasons: number;
  description: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: "Controlando a Ansiedade nos Dias de Jogo",
    instructor: "Dr. Roberto Mendes",
    duration: "2h 30min",
    lessons: 8,
    rating: 4.9,
    thumbnail: "🎯",
    isPremium: false,
    category: "Ansiedade",
    progress: 45,
    tag: "Continue assistindo",
    year: "2024",
    seasons: 1,
    description: "Aprenda técnicas práticas para controlar a ansiedade antes, durante e depois dos jogos do seu time.",
  },
  {
    id: 2,
    title: "Lidando com Derrotas e Frustrações",
    instructor: "Dra. Camila Souza",
    duration: "1h 45min",
    lessons: 6,
    rating: 4.8,
    thumbnail: "💪",
    isPremium: false,
    category: "Resiliência",
    tag: "Novos episódios",
    year: "2024",
    seasons: 2,
    description: "Desenvolva resiliência emocional para lidar com derrotas do seu time favorito.",
  },
  {
    id: 3,
    title: "Torcida Saudável: Família e Futebol",
    instructor: "Dr. Fernando Lima",
    duration: "3h 15min",
    lessons: 12,
    rating: 4.7,
    thumbnail: "👨‍👩‍👧‍👦",
    isPremium: true,
    category: "Relacionamentos",
    tag: "Top 10",
    year: "2024",
    seasons: 1,
    description: "Como equilibrar a paixão pelo futebol com os relacionamentos familiares.",
  },
  {
    id: 4,
    title: "Masculinidade e Emoções no Esporte",
    instructor: "Dr. André Costa",
    duration: "2h",
    lessons: 7,
    rating: 5.0,
    thumbnail: "🧠",
    isPremium: true,
    category: "Autoconhecimento",
    tag: "Nova temporada",
    year: "2024",
    seasons: 3,
    description: "Quebre tabus sobre masculinidade e aprenda a expressar suas emoções.",
  },
  {
    id: 5,
    title: "Mindfulness para Torcedores",
    instructor: "Dra. Paula Rodrigues",
    duration: "1h 30min",
    lessons: 5,
    rating: 4.6,
    thumbnail: "🧘",
    isPremium: false,
    category: "Bem-estar",
    year: "2023",
    seasons: 1,
    description: "Técnicas de meditação e atenção plena para momentos de tensão nos jogos.",
  },
  {
    id: 6,
    title: "Finanças Emocionais: Apostas e Saúde Mental",
    instructor: "Dr. Marcos Silva",
    duration: "4h",
    lessons: 15,
    rating: 4.9,
    thumbnail: "💰",
    isPremium: true,
    category: "Finanças",
    tag: "Top 10",
    year: "2024",
    seasons: 2,
    description: "Entenda a relação entre apostas esportivas e saúde mental.",
  },
];

const categories = ["Todos", "Ansiedade", "Resiliência", "Relacionamentos", "Autoconhecimento", "Bem-estar", "Finanças"];

const Cursos = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const continueWatching = courses.filter((c) => c.progress);
  const topTen = courses.filter((c) => c.tag === "Top 10");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24">
        {/* Hero */}
        <div className="px-4 mb-6">
          <h1 className="font-display text-4xl text-primary mb-2">
            Fanati<span className="text-secondary">Class</span>
          </h1>
          <p className="text-muted-foreground">
            Cursos para desenvolver sua inteligência emocional
          </p>
        </div>

        {/* Search */}
        <div className="px-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-card-foreground hover:border-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Watching */}
        {continueWatching.length > 0 && selectedCategory === "Todos" && (
          <div className="mb-8">
            <h2 className="font-display text-2xl text-card-foreground px-4 mb-4">
              Continue Assistindo
            </h2>
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
              {continueWatching.map((course) => (
                <Link
                  key={course.id}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 w-64 bg-card border border-border rounded-xl overflow-hidden group hover:border-primary transition-colors"
                >
                  <div className="h-32 bg-muted flex items-center justify-center text-5xl">
                    {course.thumbnail}
                  </div>
                  <div className="p-4">
                    <h3 className="text-card-foreground font-medium text-sm line-clamp-2 mb-2">
                      {course.title}
                    </h3>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top 10 */}
        {topTen.length > 0 && selectedCategory === "Todos" && (
          <div className="mb-8">
            <h2 className="font-display text-2xl text-card-foreground px-4 mb-4">
              Top 10 da Semana
            </h2>
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
              {topTen.map((course, index) => (
                <Link
                  key={course.id}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 flex items-center gap-2 group"
                >
                  <span className="font-display text-6xl text-primary/30">
                    {index + 1}
                  </span>
                  <div className="w-28 h-40 bg-card border border-border rounded-xl overflow-hidden group-hover:border-primary transition-colors">
                    <div className="h-full bg-muted flex items-center justify-center text-4xl">
                      {course.thumbnail}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Courses */}
        <div className="px-4">
          <h2 className="font-display text-2xl text-card-foreground mb-4">
            {selectedCategory === "Todos" ? "Todos os Cursos" : selectedCategory}
          </h2>

          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/curso/${course.id}`}
                className="flex gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors group"
              >
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-3xl flex-shrink-0">
                  {course.thumbnail}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-card-foreground font-medium text-sm line-clamp-2">
                      {course.title}
                    </h3>
                    {course.isPremium && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded flex-shrink-0">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">
                    {course.instructor}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary" />
                      {course.rating}
                    </span>
                    <span>{course.lessons} aulas</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary self-center group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Cursos;
