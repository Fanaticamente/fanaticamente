import { useState, useEffect, useRef } from "react";
import { RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopPreviewProps {
  currentPage?: string;
  refreshTrigger?: number;
}

const DesktopPreview = ({ currentPage = "/", refreshTrigger = 0 }: DesktopPreviewProps) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsLoading(true);
      setLastError(null);
      setIframeKey(prev => prev + 1);
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setIsLoading(true);
    setLastError(null);
    setIframeKey(prev => prev + 1);
  };

  const handleOpenInNewTab = () => {
    window.open(currentPage, "_blank");
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setLastError("Falha ao carregar o preview (iframe). Pode haver redirecionamento/reload em loop.");
  };

  // Build preview URL with embed flag and force desktop view
  const previewUrl = (() => {
    const url = new URL(currentPage, window.location.origin);
    url.searchParams.set("embed", "1");
    url.searchParams.set("forceDesktop", "1");
    return url.toString();
  })();

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
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenInNewTab}
            className="h-8 gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Nova aba
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
                {currentPage}
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="relative" style={{ width: 1280, height: 800 }}>
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {lastError && (
              <div className="absolute inset-0 bg-background/95 z-20 p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-card-foreground mb-2">Preview indisponível</p>
                <p className="text-sm text-muted-foreground mb-4">{lastError}</p>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg break-all">
                  URL: {previewUrl}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleRefresh}>Tentar novamente</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(previewUrl, "_blank")}>Abrir URL do preview</Button>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Desktop Preview"
              onLoad={handleLoad}
              onError={handleError}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopPreview;
