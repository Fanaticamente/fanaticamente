import { useEffect, useRef, useState } from "react";
import { Smartphone, Tablet, Monitor, RotateCcw, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppPages } from "@/hooks/useAppPages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MobilePreviewProps {
  route?: string;
  onRouteChange?: (route: string) => void;
}

const MobilePreview = ({ route, onRouteChange }: MobilePreviewProps) => {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [scale, setScale] = useState(100);
  const [refreshKey, setRefreshKey] = useState(0);
  const [internalRoute, setInternalRoute] = useState("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: pages } = useAppPages("mobile");

  const currentRoute = route ?? internalRoute;

  const setRoute = (next: string) => {
    setInternalRoute(next);
    onRouteChange?.(next);
  };

  // Keep internal state in sync when parent drives the route
  useEffect(() => {
    if (route) setInternalRoute(route);
  }, [route]);

  const src = `${currentRoute}${currentRoute.includes("?") ? "&" : "?"}forceMobile=1`;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-hidden">
      {/* Device Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background flex-shrink-0">
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
          <div className="w-px h-6 bg-border mx-1" />
          <Select value={currentRoute} onValueChange={setRoute}>
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="Selecionar tela" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(pages || [])
                .filter(p => p.is_visible)
                .map(p => (
                  <SelectItem key={p.id} value={p.path} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(src, "_blank")}
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
      
      {/* Device Frame Container - scrollable */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-6">
        <div
          className="relative transition-all duration-300 flex-shrink-0"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: "top center",
          }}
        >
          {/* Phone Frame - black bezel */}
          <div className="bg-zinc-900 rounded-[3rem] p-3 shadow-2xl border border-zinc-700">
            {/* Status Bar / Dynamic Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-900 rounded-b-2xl z-10" />
            
            {/* Screen */}
            <div
              className="bg-background rounded-[2.5rem] overflow-hidden relative border border-zinc-800"
              style={{
                width: device === "mobile" ? 375 : device === "tablet" ? 500 : 800,
                height: device === "mobile" ? 812 : device === "tablet" ? 700 : 600,
              }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-zinc-900 rounded-b-3xl z-20 flex items-center justify-center">
                <div className="w-16 h-4 bg-zinc-800 rounded-full" />
              </div>
              
              {/* Content - Live app preview */}
              <iframe
                key={refreshKey}
                ref={iframeRef}
                src={src}
                title="Preview do app"
                className="w-full h-full border-0 bg-background"
              />
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
