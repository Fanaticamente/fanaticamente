import { useState, useEffect, useRef, useCallback } from "react";
import { Smartphone, Tablet, Monitor, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobilePreviewProps {
  children?: React.ReactNode;
  currentPage?: string;
}

const MobilePreview = ({ children, currentPage = "/" }: MobilePreviewProps) => {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [scale, setScale] = useState(100);
  const [iframeKey, setIframeKey] = useState(0);
  const lastRefreshRef = useRef<number>(0);
  
  const deviceWidths = {
    mobile: 375,
    tablet: 768,
    desktop: 1024,
  };

  // Debounced refresh function - only refresh if at least 2 seconds have passed
  const debouncedRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current > 2000) {
      lastRefreshRef.current = now;
      setIframeKey(prev => prev + 1);
    }
  }, []);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

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
            <RefreshCw className="w-4 h-4" />
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
          className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl transition-all duration-300"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: "top center",
          }}
        >
          {/* Status Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
          
          {/* Screen */}
          <div
            className="bg-background rounded-[2.5rem] overflow-hidden relative"
            style={{
              width: device === "mobile" ? 375 : device === "tablet" ? 500 : 800,
              height: device === "mobile" ? 812 : device === "tablet" ? 700 : 600,
            }}
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-gray-900 rounded-b-3xl z-20 flex items-center justify-center">
              <div className="w-20 h-5 bg-gray-800 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="h-full overflow-y-auto">
              {children || (
                <iframe
                  key={iframeKey}
                  src={currentPage}
                  className="w-full h-full border-0"
                  title="App Preview"
                />
              )}
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
