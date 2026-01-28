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
      <div className="flex items-center justify-between p-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-card-foreground">Preview Desktop</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            1280 × 800
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
      
      {/* Desktop Frame */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-6">
        <div className="relative bg-card border-2 border-muted rounded-xl shadow-2xl overflow-hidden">
          {/* Browser Chrome */}
          <div className="h-8 bg-muted flex items-center gap-2 px-3 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <div className="w-3 h-3 rounded-full bg-primary/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-background/80 px-4 py-1 rounded text-xs text-muted-foreground max-w-md truncate">
                fanaticamente.com
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="relative" style={{ width: 1280, height: 800 }}>
            <StaticDesktopView key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopPreview;
