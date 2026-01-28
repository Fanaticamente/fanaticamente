import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaticDesktopView from "./StaticDesktopView";

const DesktopPreview = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-card-foreground">Preview Desktop</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Largura total • Rolagem vertical
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-8 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>
      
      {/* Content Area - simple scrollable container with native scrollbar */}
      <div className="flex-1 overflow-auto">
        <StaticDesktopView key={refreshKey} />
      </div>
    </div>
  );
};

export default DesktopPreview;
