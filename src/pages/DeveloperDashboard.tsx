import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppModules, AppModule } from "@/hooks/useAppModules";
import ModuleCatalog from "@/components/studio/ModuleCatalog";
import MobilePreview from "@/components/studio/MobilePreview";
import ModuleList from "@/components/studio/ModuleList";
import ModuleEditor from "@/components/studio/ModuleEditor";
import { Code, Loader2, Monitor } from "lucide-react";

const DeveloperDashboard = () => {
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
  const { data: modules, isLoading } = useAppModules();

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

  if (loading || isLoading) {
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
    <div className="min-h-screen w-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
            <Code className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-lg text-card-foreground">
              Gerenciador de Conteúdo
            </h1>
            <p className="text-xs text-muted-foreground">
              Edite e visualize em tempo real
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {modules?.length || 0} módulos
          </span>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs text-secondary">Conectado</span>
        </div>
      </header>

      {/* Main Content - Fixed Height for Manager */}
      <div className="h-[calc(100vh-56px)] flex">
        {/* Left Panel - Module Catalog */}
        <aside className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
          <ModuleCatalog />
        </aside>
        
        {/* Center - Preview (disabled inline to avoid reload loops) */}
        <main className="flex-1 min-w-0 bg-muted/30 overflow-hidden flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl text-card-foreground mb-2">Preview</h2>
            <p className="text-sm text-muted-foreground mb-4">
              O preview embutido foi desativado para eliminar o looping de atualização no Gerenciador.
              Abra o preview em uma nova aba quando precisar visualizar o app.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open("/?embed=1", "_blank", "noopener,noreferrer")}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                Abrir preview em nova aba
              </button>
              <button
                type="button"
                onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                Abrir app normal
              </button>
            </div>
          </div>
        </main>
        
        {/* Right Panel - Module List or Editor */}
        <aside className="w-96 bg-card border-l border-border flex-shrink-0 overflow-y-auto">
          {selectedModule ? (
            <ModuleEditor 
              module={selectedModule} 
              onClose={() => setSelectedModule(null)} 
            />
          ) : (
            <ModuleList
              modules={modules || []}
              selectedModuleId={selectedModule?.id}
              onSelectModule={setSelectedModule}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
