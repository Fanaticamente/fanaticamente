import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import ContentEditor from "@/components/developer/ContentEditor";
import MenuEditor from "@/components/developer/MenuEditor";
import ImageManager from "@/components/developer/ImageManager";
import NewContentDialog from "@/components/developer/NewContentDialog";
import { useAppContent } from "@/hooks/useAppContent";
import { 
  Code, Database, Server, Terminal, GitBranch, Bug, Activity, 
  FileText, Menu, Image, Settings, ChevronRight, Layout, Palette
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DeveloperDashboard = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("content");
  
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

      <main className="pt-20 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center">
              <Code className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-card-foreground">
                Painel do Desenvolvedor
              </h1>
              <p className="text-muted-foreground">
                Ferramentas completas de edição e desenvolvimento
              </p>
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{contentStats.texts}</p>
            <p className="text-xs text-muted-foreground">Textos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Image className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{contentStats.images}</p>
            <p className="text-xs text-muted-foreground">Imagens</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Layout className="w-6 h-6 text-therapy mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{contentStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Content Management Tabs */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl text-card-foreground">Gerenciador de Conteúdo</h2>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Textos
              </TabsTrigger>
              <TabsTrigger value="menus" className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                Menus
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Imagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <NewContentDialog categories={categories} />
              <div className="mt-4">
                <ContentEditor />
              </div>
            </TabsContent>

            <TabsContent value="menus">
              <MenuEditor />
            </TabsContent>

            <TabsContent value="images">
              <ImageManager />
            </TabsContent>
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
