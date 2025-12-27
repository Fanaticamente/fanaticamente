import { useState } from "react";
import { Play, ChevronLeft, Star, Clock, Lock, Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface Episode {
  id: number;
  number: number;
  title: string;
  duration: string;
  description: string;
  progress?: number;
}

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
  year: string;
  seasons: number;
  description: string;
  episodes: Episode[];
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
    year: "2024",
    seasons: 1,
    description: "Aprenda técnicas práticas para controlar a ansiedade antes, durante e depois dos jogos do seu time. Este curso aborda desde respiração até técnicas cognitivas avançadas.",
    episodes: [
      { id: 1, number: 1, title: "Capítulo um: Entendendo a ansiedade do torcedor", duration: "24m", description: "Introdução ao fenômeno da ansiedade relacionada ao futebol.", progress: 100 },
      { id: 2, number: 2, title: "Capítulo dois: Técnicas de respiração", duration: "18m", description: "Aprenda técnicas de respiração para momentos de tensão.", progress: 75 },
      { id: 3, number: 3, title: "Capítulo três: Reestruturação cognitiva", duration: "22m", description: "Como mudar pensamentos negativos." },
      { id: 4, number: 4, title: "Capítulo quatro: Mindfulness no estádio", duration: "20m", description: "Práticas de atenção plena." },
      { id: 5, number: 5, title: "Capítulo cinco: Gerenciando expectativas", duration: "25m", description: "Como criar expectativas realistas." },
      { id: 6, number: 6, title: "Capítulo seis: A hora do jogo", duration: "19m", description: "Estratégias para o dia da partida." },
      { id: 7, number: 7, title: "Capítulo sete: Pós-jogo", duration: "21m", description: "Como processar vitórias e derrotas." },
      { id: 8, number: 8, title: "Capítulo oito: Mantendo o equilíbrio", duration: "23m", description: "Construindo uma relação saudável com o futebol." },
    ],
  },
];

const CursoDetalhe = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"episodes" | "about">("episodes");

  const course = courses.find((c) => c.id === Number(id)) || courses[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24">
        {/* Back Button */}
        <div className="px-4 mb-4">
          <Link
            to="/cursos"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </Link>
        </div>

        {/* Hero */}
        <div className="relative h-48 mx-4 rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-therapy to-therapy/60 flex items-center justify-center">
            <span className="text-8xl">{course.thumbnail}</span>
          </div>
          <button className="absolute inset-0 flex items-center justify-center bg-background/20 hover:bg-background/30 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {course.isPremium && (
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                Premium
              </span>
            )}
            <span className="text-muted-foreground text-sm">{course.year}</span>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-muted-foreground text-sm">{course.seasons} temporada</span>
          </div>

          <h1 className="font-display text-3xl text-card-foreground mb-2">
            {course.title}
          </h1>

          <p className="text-muted-foreground text-sm mb-4">
            {course.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary" />
              {course.rating}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration}
            </span>
            <span>{course.lessons} aulas</span>
          </div>

          <p className="text-card-foreground text-sm">
            Por <span className="text-primary">{course.instructor}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab("episodes")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "episodes"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Episódios
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "about"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Sobre
            </button>
          </div>
        </div>

        {/* Episodes */}
        {activeTab === "episodes" && (
          <div className="px-4 space-y-3">
            {course.episodes.map((episode) => (
              <button
                key={episode.id}
                className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {episode.progress === 100 ? (
                    <Check className="w-6 h-6 text-secondary" />
                  ) : (
                    <span className="font-display text-xl text-muted-foreground">
                      {episode.number}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-card-foreground font-medium text-sm line-clamp-1 mb-1">
                    {episode.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-1">
                    {episode.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {episode.duration}
                    </span>
                    {episode.progress !== undefined && episode.progress < 100 && (
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-20">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${episode.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Play className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>
        )}

        {/* About */}
        {activeTab === "about" && (
          <div className="px-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display text-xl text-card-foreground mb-4">
                Sobre o Curso
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {course.description}
              </p>

              <h4 className="font-display text-lg text-card-foreground mb-3">
                Instrutor
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-therapy/20 flex items-center justify-center">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <div>
                  <p className="text-card-foreground font-medium">
                    {course.instructor}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Psicólogo especialista
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CursoDetalhe;
