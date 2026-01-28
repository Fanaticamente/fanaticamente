import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DesktopPreview from "@/components/studio/DesktopPreview";
import DesktopModuleList from "@/components/studio/DesktopModuleList";
import DesktopModuleEditor from "@/components/studio/DesktopModuleEditor";
import ModuleCatalog from "@/components/studio/ModuleCatalog";
import { Monitor, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppModule } from "@/hooks/useAppModules";

const DESKTOP_MANAGER_SELECTED_MODULE_KEY = "fanatica_desktop_manager_selected_module";

const safeJsonParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const DesktopContentManager = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    if (!loading && (!user || !hasRole("developer"))) {
      navigate("/");
    }
  }, [user, hasRole, loading, navigate]);

  // Restore last selected module when returning to this page.
  useEffect(() => {
    try {
      const saved = safeJsonParse<AppModule>(localStorage.getItem(DESKTOP_MANAGER_SELECTED_MODULE_KEY));
      if (saved?.id) setSelectedModule(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleSelectModule = (module: AppModule) => {
    setSelectedModule(module);
    try {
      localStorage.setItem(DESKTOP_MANAGER_SELECTED_MODULE_KEY, JSON.stringify(module));
    } catch {
      // ignore
    }
  };

  const handleCloseEditor = () => {
    setSelectedModule(null);
    try {
      localStorage.removeItem(DESKTOP_MANAGER_SELECTED_MODULE_KEY);
    } catch {
      // ignore
    }
  };

  const handleModuleSaved = () => {
    // Refresh preview when module is saved
    setPreviewKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          
          <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-lg text-card-foreground">
              Gerenciador Desktop/Web
            </h1>
            <p className="text-xs text-muted-foreground">
              Edite o site institucional
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Site Desktop
          </span>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs text-secondary">Conectado</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Module Catalog (hidden when editor is open) */}
        {!selectedModule && (
          <aside className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
            <ModuleCatalog />
          </aside>
        )}
        
        {/* Center - Desktop Preview */}
        <main className="flex-1 min-w-0 bg-muted/30 overflow-hidden">
          <DesktopPreview key={previewKey} />
        </main>
        
        {/* Right Panel - Module List or Editor */}
        <aside className="w-96 bg-card border-l border-border flex-shrink-0 overflow-hidden">
          {selectedModule ? (
            <DesktopModuleEditor
              module={selectedModule}
              onClose={handleCloseEditor}
              onSaved={handleModuleSaved}
            />
          ) : (
            <DesktopModuleList
              selectedModuleId={selectedModule?.id}
              onSelectModule={handleSelectModule}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default DesktopContentManager;
