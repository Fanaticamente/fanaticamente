import { useState } from "react";
import { Play, Star, Clock, ChevronRight, Search, Plus, ThumbsUp, Share2, Download, ChevronDown } from "lucide-react";
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

const categories = ["Séries", "Filmes", "Categorias"];

const Cursos = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const continueWatching = courses.filter((c) => c.progress);
  const topTen = courses.filter((c) => c.tag === "Top 10");
  const newEpisodes = courses.filter((c) => c.tag === "Novos episódios" || c.tag === "Nova temporada");
  const featuredCourse = courses[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 pb-24">
        {/* Category Pills */}
        <div className="px-4 py-3 flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              }`}
            >
              {cat}
              {cat === "Categorias" && <ChevronDown className="w-4 h-4 inline ml-1" />}
            </button>
          ))}
        </div>

        {/* Featured Hero Card */}
        <div className="px-4 mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-muted to-card aspect-[4/5] max-h-[500px]">
            {/* Background with emoji */}
            <div className="absolute inset-0 flex items-center justify-center text-[180px] opacity-30">
              {featuredCourse.thumbnail}
            </div>
            
            {/* Content overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            {/* Featured content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="font-display text-3xl text-foreground mb-2 leading-tight">
                {featuredCourse.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {featuredCourse.description}
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  to={`/curso/${featuredCourse.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Assistir
                </Link>
                <button className="flex items-center justify-center gap-2 py-3 px-6 bg-muted/80 text-foreground rounded-lg font-medium hover:bg-muted transition-colors">
                  <Plus className="w-5 h-5" />
                  Minha lista
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* New Episodes Section */}
        {newEpisodes.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl text-foreground px-4 mb-3">
              Chega de tédio
            </h2>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
              {newEpisodes.map((course) => (
                <Link
                  key={course.id}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {course.thumbnail}
                    </div>
                    {course.tag && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive text-destructive-foreground text-xs font-bold py-1 px-2 text-center">
                        {course.tag}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {courses.slice(0, 4).map((course) => (
                <Link
                  key={`extra-${course.id}`}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {course.thumbnail}
                    </div>
                    {course.isPremium && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold py-0.5 px-2 rounded">
                        TOP 10
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top 10 Section */}
        {topTen.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl text-foreground px-4 mb-3">
              Brasil: top 10 em séries hoje
            </h2>
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
              {topTen.map((course, index) => (
                <Link
                  key={course.id}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 flex items-end"
                >
                  <span className="font-display text-[100px] leading-none text-foreground/20 -mr-4 relative z-0">
                    {index + 1}
                  </span>
                  <div className="relative w-28 aspect-[2/3] rounded-lg overflow-hidden bg-muted z-10">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      {course.thumbnail}
                    </div>
                    {course.tag && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive text-destructive-foreground text-xs font-bold py-1 px-2 text-center">
                        {course.tag}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {courses.slice(2, 5).map((course, index) => (
                <Link
                  key={`top-extra-${course.id}`}
                  to={`/curso/${course.id}`}
                  className="flex-shrink-0 flex items-end"
                >
                  <span className="font-display text-[100px] leading-none text-foreground/20 -mr-4 relative z-0">
                    {index + 3}
                  </span>
                  <div className="relative w-28 aspect-[2/3] rounded-lg overflow-hidden bg-muted z-10">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      {course.thumbnail}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl text-foreground px-4 mb-3">
              Continuar assistindo
            </h2>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
              {continueWatching.map((course) => (
                <div key={course.id} className="flex-shrink-0 w-36">
                  <Link to={`/curso/${course.id}`} className="block">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-1">
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        {course.thumbnail}
                      </div>
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center bg-background/50">
                          <Play className="w-4 h-4 text-foreground fill-current ml-0.5" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
                        <div 
                          className="h-full bg-destructive" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                  {/* Action icons */}
                  <div className="flex justify-between mt-2">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <span className="w-5 h-5 rounded-full border border-foreground flex items-center justify-center text-xs">i</span>
                    </button>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <span className="text-foreground">⋮</span>
                    </button>
                  </div>
                </div>
              ))}
              {courses.slice(1, 4).map((course) => (
                <div key={`cont-${course.id}`} className="flex-shrink-0 w-36">
                  <Link to={`/curso/${course.id}`} className="block">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-1">
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        {course.thumbnail}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center bg-background/50">
                          <Play className="w-4 h-4 text-foreground fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex justify-between mt-2">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <span className="w-5 h-5 rounded-full border border-foreground flex items-center justify-center text-xs">i</span>
                    </button>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <span className="text-foreground">⋮</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Courses by Category */}
        <div className="mb-6">
          <h2 className="font-display text-xl text-foreground px-4 mb-3">
            Bem-estar
          </h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
            {courses.filter(c => c.category === "Bem-estar" || c.category === "Ansiedade").map((course) => (
              <Link
                key={course.id}
                to={`/curso/${course.id}`}
                className="flex-shrink-0 w-32"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">
                    {course.thumbnail}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-display text-xl text-foreground px-4 mb-3">
            Autoconhecimento
          </h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
            {courses.filter(c => c.category === "Autoconhecimento" || c.category === "Resiliência").map((course) => (
              <Link
                key={course.id}
                to={`/curso/${course.id}`}
                className="flex-shrink-0 w-32"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">
                    {course.thumbnail}
                  </div>
                </div>
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