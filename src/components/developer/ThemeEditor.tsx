import { useState, useEffect } from "react";
import { useAppContent, useUpdateContent } from "@/hooks/useAppContent";
import { toast } from "sonner";
import { Palette, Save, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ThemeColor {
  key: string;
  label: string;
  category: string;
}

const themeColors: ThemeColor[] = [
  { key: "theme_primary", label: "Cor Primária", category: "Geral" },
  { key: "theme_secondary", label: "Cor Secundária", category: "Geral" },
  { key: "theme_accent", label: "Cor de Destaque", category: "Geral" },
  { key: "theme_background", label: "Cor de Fundo", category: "Geral" },
  { key: "theme_therapy", label: "Cor Terapeutas", category: "Páginas" },
  { key: "theme_quiz", label: "Cor Quiz", category: "Páginas" },
  { key: "theme_radio", label: "Cor Rádio", category: "Páginas" },
];

const defaultColors: Record<string, string> = {
  theme_primary: "45 100% 51%",
  theme_secondary: "145 63% 32%",
  theme_accent: "210 100% 45%",
  theme_background: "0 0% 8%",
  theme_therapy: "280 60% 50%",
  theme_quiz: "200 80% 50%",
  theme_radio: "15 80% 50%",
};

const hslToHex = (hsl: string): string => {
  const parts = hsl.split(" ");
  if (parts.length !== 3) return "#ffffff";
  
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 50%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const ThemeEditor = () => {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: contents, isLoading } = useAppContent();
  const updateContent = useUpdateContent();

  useEffect(() => {
    if (contents) {
      const colorContents = contents.filter(c => (c.type as string) === 'color');
      const colorMap: Record<string, string> = {};
      colorContents.forEach(c => {
        colorMap[c.key] = c.value;
      });
      // Merge with defaults for missing values
      themeColors.forEach(tc => {
        if (!colorMap[tc.key]) {
          colorMap[tc.key] = defaultColors[tc.key] || "0 0% 50%";
        }
      });
      setColors(colorMap);
    }
  }, [contents]);

  const handleColorChange = (key: string, hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    setColors(prev => ({ ...prev, [key]: hslValue }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(colors)) {
        await updateContent.mutateAsync({ key, value });
      }
      toast.success("Cores do tema salvas com sucesso!");
      setHasChanges(false);
      
      // Apply colors to CSS variables
      applyThemeColors();
    } catch (error) {
      toast.error("Erro ao salvar cores do tema");
    }
  };

  const handleReset = () => {
    setColors(defaultColors);
    setHasChanges(true);
  };

  const applyThemeColors = () => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace('theme_', '')}`;
      root.style.setProperty(cssVar, value);
    });
  };

  const groupedColors = themeColors.reduce((acc, color) => {
    if (!acc[color.category]) {
      acc[color.category] = [];
    }
    acc[color.category].push(color);
    return acc;
  }, {} as Record<string, ThemeColor[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateContent.isPending}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>

      {/* Color Groups */}
      {Object.entries(groupedColors).map(([category, categoryColors]) => (
        <div key={category} className="space-y-4">
          <h3 className="font-display text-xl text-primary flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryColors.map((colorConfig) => {
              const currentValue = colors[colorConfig.key] || defaultColors[colorConfig.key];
              const hexValue = hslToHex(currentValue);
              
              return (
                <div
                  key={colorConfig.key}
                  className="bg-muted/50 border border-border rounded-xl p-4"
                >
                  <Label className="text-sm font-medium mb-3 block">
                    {colorConfig.label}
                  </Label>
                  
                  <div className="flex items-center gap-3">
                    {/* Color Picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={hexValue}
                        onChange={(e) => handleColorChange(colorConfig.key, e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                        style={{ backgroundColor: hexValue }}
                      />
                    </div>
                    
                    {/* HSL Display */}
                    <div className="flex-1">
                      <Input
                        value={currentValue}
                        onChange={(e) => {
                          setColors(prev => ({ ...prev, [colorConfig.key]: e.target.value }));
                          setHasChanges(true);
                        }}
                        placeholder="H S% L%"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: H S% L% (ex: 45 100% 51%)
                      </p>
                    </div>

                    {/* Preview */}
                    <div
                      className="w-16 h-12 rounded-lg border border-border flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: `hsl(${currentValue})`,
                        color: parseInt(currentValue.split(' ')[2]) > 50 ? '#000' : '#fff'
                      }}
                    >
                      Aa
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Live Preview */}
      <div className="bg-muted/50 border border-border rounded-xl p-6">
        <h3 className="font-display text-xl text-primary mb-4">Pré-visualização</h3>
        <div className="flex flex-wrap gap-3">
          {themeColors.map((colorConfig) => {
            const currentValue = colors[colorConfig.key] || defaultColors[colorConfig.key];
            return (
              <div
                key={colorConfig.key}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: `hsl(${currentValue})`,
                  color: parseInt(currentValue.split(' ')[2]) > 50 ? '#000' : '#fff'
                }}
              >
                {colorConfig.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;
