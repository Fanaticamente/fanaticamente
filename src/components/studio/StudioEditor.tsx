import { useState } from "react";
import { useAppModules, AppModule } from "@/hooks/useAppModules";
import ModuleCatalog from "./ModuleCatalog";
import MobilePreview from "./MobilePreview";
import ModuleList from "./ModuleList";
import ModuleEditor from "./ModuleEditor";
import { Loader2 } from "lucide-react";

const StudioEditor = () => {
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [currentPage, setCurrentPage] = useState("home");
  const { data: modules, isLoading } = useAppModules();

  // Preview is now 100% static - only refreshes via manual button inside MobilePreview

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] flex bg-background rounded-xl overflow-hidden border border-border">
      {/* Left Panel - Module Catalog */}
      <div className="w-72 border-r border-border bg-card flex-shrink-0 overflow-hidden">
        <ModuleCatalog />
      </div>
      
      {/* Center - Mobile Preview (static, manual refresh only) */}
      <div className="flex-1 min-w-0 flex items-center justify-center bg-muted/30">
        <MobilePreview />
      </div>
      
      {/* Right Panel - Module List or Editor */}
      <div className="w-96 border-l border-border bg-card flex-shrink-0 overflow-hidden">
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
      </div>
    </div>
  );
};

export default StudioEditor;
