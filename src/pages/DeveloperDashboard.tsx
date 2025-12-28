import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import ContentEditor from "@/components/developer/ContentEditor";
import MenuEditor from "@/components/developer/MenuEditor";
import ImageManager from "@/components/developer/ImageManager";
import ThemeEditor from "@/components/developer/ThemeEditor";
import NewContentDialog from "@/components/developer/NewContentDialog";
import StudioEditor from "@/components/studio/StudioEditor";
import { useAppContent } from "@/hooks/useAppContent";
import { 
  Code, Database, Server, Terminal, GitBranch, Bug, Activity, 
  FileText, Menu, Image, Settings, ChevronRight, Layout, Palette, Layers
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DeveloperDashboard = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("studio");
  
  const { data: contents } = useAppContent();
  const categories = contents 
    ? [...new Set(contents.map(c => c.category))]
    : [];

  useEffect(() => {
    if (!loading && (!user || !hasRole("developer"))) {
      navigate("/");
    }
  }, [user, hasRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const devTools = [
    { icon: Database, label: "Banco de Dados", description: "Gerenciar tabelas e queries", color: "text-primary" },
    { icon: Server, label: "Edge Functions", description: "Funções serverless", color: "text-secondary" },
    { icon: Terminal, label: "Console", description: "Logs e debugging", color: "text-therapy" },
    { icon: GitBranch, label: "Versionamento", description: "Histórico de alterações", color: "text-primary" },
    { icon: Bug, label: "Debug Mode", description: "Ferramentas de diagnóstico", color: "text-destructive" },
    { icon: Activity, label: "Métricas", description: "Performance e analytics", color: "text-secondary" },
  ];

  const contentStats = {
    texts: contents?.filter(c => c.type === 'text').length || 0,
    images: contents?.filter(c => c.type === 'image').length || 0,
    total: contents?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center">
              <Code className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl text-card-foreground">
                Painel do Desenvolvedor
              </h1>
              <p className="text-muted-foreground text-sm">
                Ferramentas completas de edição e desenvolvimento
              </p>
            </div>
            {/* Content Stats inline */}
            <div className="hidden md:flex gap-4">
              <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-card-foreground">{contentStats.texts}</span>
                <span className="text-xs text-muted-foreground">Textos</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-lg">
                <Image className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold text-card-foreground">{contentStats.images}</span>
                <span className="text-xs text-muted-foreground">Imagens</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-lg">
                <Layout className="w-4 h-4 text-therapy" />
                <span className="text-sm font-bold text-card-foreground">{contentStats.total}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Management Tabs - Full Width */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-card-foreground">Gerenciador de Conteúdo</h2>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                <TabsTrigger value="studio" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Studio</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Textos</span>
                </TabsTrigger>
                <TabsTrigger value="menus" className="flex items-center gap-2">
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Menus</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Imagens</span>
                </TabsTrigger>
                <TabsTrigger value="theme" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Tema</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="studio" className="mt-0">
                <StudioEditor />
              </TabsContent>

              <TabsContent value="content" className="mt-0">
                <NewContentDialog categories={categories} />
                <div className="mt-4">
                  <ContentEditor />
                </div>
              </TabsContent>

              <TabsContent value="menus" className="mt-0">
                <MenuEditor />
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                <ImageManager />
              </TabsContent>

              <TabsContent value="theme" className="mt-0">
                <ThemeEditor />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* System Status */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl text-card-foreground mb-4">Status do Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-green-400 font-medium text-sm">API</p>
              <p className="text-muted-foreground text-xs">Online</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-green-400 font-medium text-sm">Database</p>
              <p className="text-muted-foreground text-xs">Conectado</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-green-400 font-medium text-sm">Auth</p>
              <p className="text-muted-foreground text-xs">Ativo</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-green-400 font-medium text-sm">Storage</p>
              <p className="text-muted-foreground text-xs">Disponível</p>
            </div>
          </div>
        </div>

        {/* Dev Tools */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl text-card-foreground mb-4">Ferramentas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {devTools.map((tool) => (
              <button
                key={tool.label}
                className="p-4 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-left group"
              >
                <tool.icon className={`w-8 h-8 ${tool.color} mb-3 group-hover:scale-110 transition-transform`} />
                <p className="text-card-foreground font-medium">{tool.label}</p>
                <p className="text-muted-foreground text-sm">{tool.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-xl text-card-foreground mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Limpar Cache
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Recarregar Config
            </button>
            <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
              Ver Logs
            </button>
            <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
              Testar Conexão
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
