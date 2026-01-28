import { useState } from "react";
import { RefreshCw, Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaticDesktopView from "./StaticDesktopView";

const DesktopPreview = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-hidden">
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
      
      {/* Desktop Frame Container - full width, scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Browser Chrome */}
          <div className="h-10 bg-zinc-800 flex items-center gap-2 px-4 border-b border-zinc-700 sticky top-0 z-10">
            {/* Window controls */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80 flex items-center justify-center">
                <X className="w-2 h-2 text-red-900 opacity-0 hover:opacity-100" />
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 flex items-center justify-center">
                <Minus className="w-2 h-2 text-yellow-900 opacity-0 hover:opacity-100" />
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 flex items-center justify-center">
                <Square className="w-1.5 h-1.5 text-green-900 opacity-0 hover:opacity-100" />
              </div>
            </div>
            
            {/* URL Bar */}
            <div className="flex-1 flex justify-center">
              <div className="bg-zinc-700 px-4 py-1.5 rounded-lg text-xs text-zinc-300 flex items-center gap-2 min-w-[300px]">
                <span className="text-green-400">🔒</span>
                <span>fanaticamente.com</span>
              </div>
            </div>
            
            {/* Spacer */}
            <div className="w-16" />
          </div>
          
          {/* Content Area - full width page view */}
          <div className="bg-[#0a0a0a]">
            <StaticDesktopView key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopPreview;
