import { useLayoutEffect, useState } from "react";
import { Users, MessageSquare, TrendingUp, Plus, Search, ThumbsUp, MessageCircle, Share2, MoreHorizontal, Clock, Filter, Flame, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    specialty: string;
  };
  community: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked?: boolean;
  tags?: string[];
}

const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      name: "Dra. Carolina Santos",
      specialty: "Psicologia Esportiva",
    },
    community: "Supervisão Clínica",
    title: "Dificuldades com paciente que apresenta resistência ao tratamento",
    content: "Tenho um paciente atleta que demonstra grande resistência em explorar questões emocionais. Ele tende a intelectualizar muito e evita o contato com sentimentos. Alguém já passou por situação semelhante? Como vocês abordariam?",
    likes: 24,
    comments: 12,
    timeAgo: "2h",
    tags: ["Resistência", "Atletas", "Técnicas"]
  },
  {
    id: "2",
    author: {
      name: "Dr. Fernando Lima",
      specialty: "TCC",
    },
    community: "Casos Clínicos",
    title: "Compartilhando sucesso: Protocolo adaptado para ansiedade de desempenho",
    content: "Quero compartilhar uma adaptação que fiz no protocolo de TCC para ansiedade de desempenho em atletas profissionais. Os resultados têm sido muito positivos após 8 sessões...",
    likes: 56,
    comments: 23,
    timeAgo: "5h",
    tags: ["TCC", "Ansiedade", "Protocolo"]
  },
  {
    id: "3",
    author: {
      name: "Dra. Amanda Reis",
      specialty: "Psicanálise",
    },
    community: "Discussões Teóricas",
    title: "A transferência no contexto esportivo: reflexões",
    content: "Venho refletindo sobre as peculiaridades da transferência quando trabalhamos com atletas. O setting diferenciado (às vezes em clubes, concentrações) impacta significativamente...",
    likes: 18,
    comments: 8,
    timeAgo: "8h",
    tags: ["Psicanálise", "Teoria", "Setting"]
  },
  {
    id: "4",
    author: {
      name: "Dr. Ricardo Mendes",
      specialty: "Neuropsicologia",
    },
    community: "Recursos e Materiais",
    title: "Indicação de leitura: novo artigo sobre lesões e saúde mental",
    content: "Acabou de sair um artigo excelente no Journal of Sport Psychology sobre o impacto psicológico de lesões graves em atletas profissionais. Link nos comentários.",
    likes: 42,
    comments: 15,
    timeAgo: "1d",
    tags: ["Artigo", "Lesões", "Pesquisa"]
  }
];

const communities = [
  { name: "Supervisão Clínica", members: 234, description: "Discussões de casos e supervisão entre pares" },
  { name: "Casos Clínicos", members: 189, description: "Compartilhe experiências e aprenda com outros" },
  { name: "Discussões Teóricas", members: 156, description: "Debates sobre abordagens e teorias" },
  { name: "Recursos e Materiais", members: 312, description: "Artigos, livros e materiais úteis" },
  { name: "Eventos e Formações", members: 278, description: "Congressos, cursos e workshops" },
];

const Conecta = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Force light theme for professional environment
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light', 'professional-theme');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#1a1a1a';
    
    return () => {
      document.documentElement.classList.remove('professional-theme');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = likedPosts.has(post.id);
    
    return (
      <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {post.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{post.author.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">{post.author.specialty}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0">
                  {post.community}
                </Badge>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.timeAgo}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 -mr-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{post.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">{post.content}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 gap-2 ${isLiked ? 'text-primary' : 'text-gray-500'} hover:text-primary hover:bg-primary/5`}
              onClick={() => handleLike(post.id)}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 text-gray-500 hover:text-primary hover:bg-primary/5"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 text-gray-500 hover:text-primary hover:bg-primary/5"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Compartilhar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const mainContent = (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar discussões, profissionais..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="w-full justify-start gap-0 h-auto p-0 bg-transparent border-b border-gray-200">
          <TabsTrigger 
            value="feed" 
            className="flex-1 max-w-[150px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <Flame className="w-4 h-4 mr-2" />
            Feed
          </TabsTrigger>
          <TabsTrigger 
            value="trending"
            className="flex-1 max-w-[150px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Em Alta
          </TabsTrigger>
          <TabsTrigger 
            value="communities"
            className="flex-1 max-w-[150px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Grupos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Create Post Button */}
      <Card className="bg-white border-gray-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary">Eu</AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              className="flex-1 justify-start text-gray-400 font-normal border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              Compartilhe algo com a comunidade...
            </Button>
            <Button size="icon" className="bg-primary hover:bg-primary/90 text-white shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <Button variant="outline" size="sm" className="shrink-0 bg-primary text-white border-primary hover:bg-primary/90 hover:text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          Para Você
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 border-gray-200 text-gray-600 hover:border-gray-300">
          Supervisão
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 border-gray-200 text-gray-600 hover:border-gray-300">
          Casos Clínicos
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 border-gray-200 text-gray-600 hover:border-gray-300">
          Teoria
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 border-gray-200 text-gray-600 hover:border-gray-300">
          <Filter className="w-3 h-3 mr-1" />
          Filtros
        </Button>
      </div>

      {activeTab === "communities" ? (
        // Communities List
        <div className={`${isMobile ? "space-y-3" : "grid grid-cols-2 gap-4"}`}>
          <h2 className={`font-semibold text-gray-900 px-1 ${isMobile ? "" : "col-span-2"}`}>Grupos Populares</h2>
          {communities.map((community, idx) => (
            <Card key={idx} className="bg-white border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{community.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{community.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{community.members} membros</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Participar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Posts Feed
        <div className={`${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}>
          {mockPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  );

  // Desktop Layout
  if (!isMobile) {
    return (
      <ProfessionalDesktopLayout title="Conecta" subtitle="Comunidade de profissionais">
        {mainContent}
      </ProfessionalDesktopLayout>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conecta</h1>
              <p className="text-sm text-gray-500">Comunidade de profissionais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-32">
        {mainContent}
      </div>

      <ProfessionalBottomNav />
    </div>
  );
};

export default Conecta;
