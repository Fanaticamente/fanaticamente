import { useState, useEffect, useRef } from "react";
import { Smartphone, Tablet, Monitor, RotateCcw, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobilePreviewProps {
  currentPage?: string;
  refreshTrigger?: number;
}

const MobilePreview = ({ currentPage = "/", refreshTrigger = 0 }: MobilePreviewProps) => {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [scale, setScale] = useState(100);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsLoading(true);
      setIframeKey(prev => prev + 1);
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleOpenInNewTab = () => {
    window.open(currentPage, "_blank");
  };

  // Build the preview URL with embed and forceMobile flags
  const previewUrl = (() => {
    const url = new URL(currentPage, window.location.origin);
    url.searchParams.set("embed", "1");
    url.searchParams.set("forceMobile", "1");
    return url.toString();
  })();

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Device Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={device === "mobile" ? "default" : "outline"}
            onClick={() => setDevice("mobile")}
            className="h-8 w-8 p-0"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={device === "tablet" ? "default" : "outline"}
            onClick={() => setDevice("tablet")}
            className="h-8 w-8 p-0"
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={device === "desktop" ? "default" : "outline"}
            onClick={() => setDevice("desktop")}
            className="h-8 w-8 p-0"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
            title="Atualizar preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenInNewTab}
            className="h-8 w-8 p-0"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {scale}%
          </span>
          <input
            type="range"
            min="50"
            max="150"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-20 h-1 accent-primary"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(100)}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Device Frame */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-6">
        <div
          className="relative bg-card border-4 border-muted rounded-[3rem] p-3 shadow-2xl transition-all duration-300"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: "top center",
          }}
        >
          {/* Status Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-card rounded-b-2xl z-10" />
          
          {/* Screen */}
          <div
            className="bg-background rounded-[2.5rem] overflow-hidden relative"
            style={{
              width: device === "mobile" ? 375 : device === "tablet" ? 500 : 800,
              height: device === "mobile" ? 812 : device === "tablet" ? 700 : 600,
            }}
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-card rounded-b-3xl z-20 flex items-center justify-center">
              <div className="w-20 h-5 bg-muted rounded-full" />
            </div>
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            
            {/* Content - Sandboxed iframe with same-origin for Supabase */}
            <div className="h-full overflow-hidden pt-8">
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={previewUrl}
                className="w-full h-full border-0"
                title="App Preview"
                onLoad={handleLoad}
                // allow-same-origin is needed for Supabase API calls
                // allow-scripts is needed for React to run
                // NO allow-top-navigation prevents redirect loops
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
