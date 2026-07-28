import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppModules, AppModule } from "@/hooks/useAppModules";
import ModuleCatalog from "@/components/studio/ModuleCatalog";
import MobilePreview from "@/components/studio/MobilePreview";
import ModuleList from "@/components/studio/ModuleList";
import ModuleEditor from "@/components/studio/ModuleEditor";
import MenuEditor from "@/components/developer/MenuEditor";
import ContentEditor from "@/components/developer/ContentEditor";
import ImageManager from "@/components/developer/ImageManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Loader2, Monitor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useManagerTheme } from "@/hooks/useManagerTheme";

const DeveloperDashboard = () => {
  useManagerTheme();
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Desktop-only check: viewport >= 1024px
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  
  // Read initial page from URL or default to "home"
  const urlPage = searchParams.get("page");
  const initialPage = urlPage || "home";
  
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [previewRoute, setPreviewRoute] = useState("/");
  const { data: modules, isLoading } = useAppModules();

  // O preview roda uma segunda instância do app no mesmo domínio. Eventos de
  // auth disparados por ela podem reativar `loading` no gerenciador; se a tela
  // voltar para o spinner, o iframe é desmontado e recarregado — gerando um
  // loop infinito de refresh. Por isso o "booting" só vale até a primeira
  // renderização completa.
  const hasBootedRef = useRef(false);
  const isBooting = !hasBootedRef.current && (loading || isLoading);
  if (!isBooting) hasBootedRef.current = true;

  const handleSelectModule = (module: AppModule) => {
    setSelectedModule(module);
    const path = (module.config as { path?: string } | null)?.path;
    if (path) setPreviewRoute(path);
    else if (module.page === "home" || module.page === "navigation") setPreviewRoute("/");
  };

  // Sync page changes to URL
  useEffect(() => {
    // Avoid navigation loops: only update the URL if it actually changed.
    const pageInUrl = searchParams.get("page") || "home";
    if (pageInUrl !== currentPage) {
      setSearchParams({ page: currentPage }, { replace: true });
    }
  }, [currentPage, searchParams, setSearchParams]);

  useEffect(() => {
    if (!loading && (!user || !hasRole("developer"))) {
      navigate("/");
    }
  }, [user, hasRole, loading, navigate]);

  // IMPORTANT: Preview refresh is manual-only (button inside the preview).

  if (isBooting) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block mobile/tablet access - desktop only
  if (!isDesktop) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-display text-2xl text-card-foreground mb-3">
            Acesso apenas pelo Desktop
          </h1>
          <p className="text-muted-foreground mb-6">
            O Gerenciador de Conteúdo está disponível apenas em computadores. 
            Por favor, acesse pelo navegador do seu computador.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/developer")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="w-px h-8 bg-border" />
          
          <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg text-card-foreground">
              Gerenciador Mobile
            </h1>
            <p className="text-xs text-muted-foreground">
              Edite o conteúdo do app
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {modules?.length || 0} módulos
          </span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary">Conectado</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Module Catalog */}
        <aside className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
          <ModuleCatalog />
        </aside>
        
        {/* Center - Mobile Preview (static view) */}
        <main className="flex-1 min-w-0 bg-muted/30 overflow-hidden">
          <MobilePreview route={previewRoute} onRouteChange={setPreviewRoute} />
        </main>
        
        {/* Right Panel - Module List or Editor */}
        <aside className="w-96 bg-card border-l border-border flex-shrink-0 overflow-y-auto">
          {selectedModule ? (
            <ModuleEditor 
              module={selectedModule} 
              onClose={() => setSelectedModule(null)}
            />
          ) : (
            <Tabs defaultValue="estrutura" className="w-full">
              <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-card h-11">
                <TabsTrigger value="estrutura" className="text-xs">Estrutura</TabsTrigger>
                <TabsTrigger value="menus" className="text-xs">Menus</TabsTrigger>
                <TabsTrigger value="conteudos" className="text-xs">Textos</TabsTrigger>
                <TabsTrigger value="imagens" className="text-xs">Imagens</TabsTrigger>
              </TabsList>
              <TabsContent value="estrutura" className="m-0">
                <ModuleList
                  modules={modules || []}
                  selectedModuleId={selectedModule?.id}
                  onSelectModule={handleSelectModule}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </TabsContent>
              <TabsContent value="menus" className="m-0 p-4">
                <MenuEditor />
              </TabsContent>
              <TabsContent value="conteudos" className="m-0 p-4">
                <ContentEditor />
              </TabsContent>
              <TabsContent value="imagens" className="m-0 p-4">
                <ImageManager />
              </TabsContent>
            </Tabs>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
