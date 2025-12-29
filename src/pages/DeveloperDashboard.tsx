import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppModules, AppModule } from "@/hooks/useAppModules";
import ModuleCatalog from "@/components/studio/ModuleCatalog";
import MobilePreview from "@/components/studio/MobilePreview";
import ModuleList from "@/components/studio/ModuleList";
import ModuleEditor from "@/components/studio/ModuleEditor";
import { Code, Loader2 } from "lucide-react";

const DeveloperDashboard = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [currentPage, setCurrentPage] = useState("home");
  const { data: modules, isLoading } = useAppModules();

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

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
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
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-500">Conectado</span>
        </div>
      </header>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Module Catalog */}
        <aside className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
          <ModuleCatalog />
        </aside>
        
        {/* Center - Mobile Preview */}
        <main className="flex-1 min-w-0 bg-muted/30">
          <MobilePreview currentPage="/" />
        </main>
        
        {/* Right Panel - Module List or Editor */}
        <aside className="w-96 bg-card border-l border-border flex-shrink-0 overflow-hidden">
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
