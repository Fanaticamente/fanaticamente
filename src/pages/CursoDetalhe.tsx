import { useState } from "react";
import { Play, ChevronLeft, Star, Clock, Lock, Check, Plus, ThumbsUp, Share2, Download, ChevronDown, X, Cast, Volume2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";

interface Episode {
  id: number;
  number: number;
  title: string;
  duration: string;
  description: string;
  progress?: number;
  timeRemaining?: string;
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
      { id: 1, number: 1, title: "Capítulo um: Entendendo a ansiedade do torcedor", duration: "24m", description: "Introdução ao fenômeno da ansiedade relacionada ao futebol.", progress: 60, timeRemaining: "24m" },
      { id: 2, number: 2, title: "Capítulo dois: Técnicas de respiração", duration: "18m", description: "Aprenda técnicas de respiração para momentos de tensão.", progress: 0 },
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
  const [activeTab, setActiveTab] = useState<"episodes" | "collection" | "similar">("episodes");

  const course = courses.find((c) => c.id === Number(id)) || courses[0];
  const currentEpisode = course.episodes.find(e => e.progress && e.progress < 100) || course.episodes[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Video Player Area */}
      <div className="relative aspect-video bg-black">
        {/* Video placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background flex items-center justify-center">
          <span className="text-[120px] opacity-50">{course.thumbnail}</span>
        </div>
        
        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end gap-4">
          <button className="p-2 text-foreground">
            <Cast className="w-6 h-6" />
          </button>
          <Link to="/cursos" className="p-2 text-foreground">
            <X className="w-6 h-6" />
          </Link>
        </div>

        {/* Volume control */}
        <div className="absolute bottom-4 right-4">
          <button className="p-2 text-foreground bg-background/50 rounded-full">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="pb-24">
        {/* Course Info */}
        <div className="px-4 py-4">
          {/* Brand/Category */}
          <p className="text-destructive font-bold text-sm mb-1 tracking-wide">
            FANATICLASS
          </p>

          <h1 className="font-display text-2xl text-foreground mb-3">
            {course.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <span className="text-foreground">{course.year}</span>
            <span className="px-1.5 py-0.5 border border-muted-foreground text-muted-foreground text-xs rounded">
              16
            </span>
            <span className="text-muted-foreground">{course.seasons} temporada</span>
            <span className="px-1.5 py-0.5 border border-muted-foreground text-muted-foreground text-xs rounded">
              HD
            </span>
          </div>

          {/* Current episode info */}
          <p className="text-foreground text-sm mb-3">
            Novo episódio disponível agora
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 mb-4">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-md font-medium">
              <Play className="w-5 h-5 fill-current" />
              Continuar
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-muted text-foreground rounded-md font-medium">
              <Download className="w-5 h-5" />
              Baixar T1:E1
            </button>
          </div>

          {/* Episode Progress */}
          <div className="mb-4">
            <p className="text-foreground font-medium text-sm mb-1">
              T1:E1 {currentEpisode.title}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive" 
                  style={{ width: `${currentEpisode.progress || 0}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">
                Tempo restante: {currentEpisode.timeRemaining || currentEpisode.duration}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {course.description}
          </p>

          {/* Cast & Creator */}
          <p className="text-muted-foreground text-xs mb-1">
            <span className="text-foreground/70">Instrutor:</span> {course.instructor}
          </p>
          <p className="text-muted-foreground text-xs mb-6">
            <span className="text-foreground/70">Criação:</span> FanaticaMente
          </p>

          {/* Quick Actions */}
          <div className="flex justify-around border-b border-border pb-4 mb-4">
            <button className="flex flex-col items-center gap-1 text-foreground">
              <Plus className="w-6 h-6" />
              <span className="text-xs">Minha lista</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-foreground">
              <ThumbsUp className="w-6 h-6" />
              <span className="text-xs">Avaliar</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-foreground">
              <Share2 className="w-6 h-6" />
              <span className="text-xs">Compartilhe</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-foreground">
              <Download className="w-6 h-6" />
              <span className="text-xs text-center leading-tight">Baixar<br/>Temporada 1</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-4">
            <button
              onClick={() => setActiveTab("episodes")}
              className={`pb-2 font-medium text-sm transition-colors ${
                activeTab === "episodes"
                  ? "text-foreground border-b-2 border-destructive"
                  : "text-muted-foreground"
              }`}
            >
              Episódios
            </button>
            <button
              onClick={() => setActiveTab("collection")}
              className={`pb-2 font-medium text-sm transition-colors ${
                activeTab === "collection"
                  ? "text-foreground border-b-2 border-destructive"
                  : "text-muted-foreground"
              }`}
            >
              Coleção
            </button>
            <button
              onClick={() => setActiveTab("similar")}
              className={`pb-2 font-medium text-sm transition-colors ${
                activeTab === "similar"
                  ? "text-foreground border-b-2 border-destructive"
                  : "text-muted-foreground"
              }`}
            >
              Títulos semelhantes
            </button>
          </div>

          {/* Season Selector */}
          {activeTab === "episodes" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md mb-4">
              <span className="text-foreground text-sm">{course.title}</span>
              <ChevronDown className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>

        {/* Episodes List */}
        {activeTab === "episodes" && (
          <div className="px-4 space-y-4">
            {course.episodes.map((episode) => (
              <div key={episode.id} className="flex gap-3">
                {/* Episode thumbnail */}
                <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {course.thumbnail}
                  </div>
                  {/* Play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center bg-background/50">
                      <Play className="w-3 h-3 text-foreground fill-current ml-0.5" />
                    </div>
                  </div>
                  {/* Duration */}
                  <div className="absolute bottom-1 right-1">
                    <span className="text-foreground text-xs bg-background/70 px-1 rounded">
                      {episode.duration}
                    </span>
                  </div>
                </div>
                
                {/* Episode info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground text-sm font-medium mb-1 line-clamp-2">
                    {episode.number}. {episode.title.replace(`Capítulo ${episode.number === 1 ? 'um' : episode.number === 2 ? 'dois' : episode.number === 3 ? 'três' : episode.number === 4 ? 'quatro' : episode.number === 5 ? 'cinco' : episode.number === 6 ? 'seis' : episode.number === 7 ? 'sete' : 'oito'}: `, '')}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {episode.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collection */}
        {activeTab === "collection" && (
          <div className="px-4">
            <p className="text-muted-foreground text-center py-8">
              Nenhum conteúdo adicional disponível
            </p>
          </div>
        )}

        {/* Similar */}
        {activeTab === "similar" && (
          <div className="px-4">
            <p className="text-muted-foreground text-center py-8">
              Em breve mais cursos semelhantes
            </p>
          </div>
        )}

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-[calc(6.5rem+env(safe-area-inset-bottom))]" />
      </main>

      <BottomNav />
    </div>
  );
};

export default CursoDetalhe;