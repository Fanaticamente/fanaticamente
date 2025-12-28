import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClubTheme {
  primaryColor: string;
  secondaryColor: string;
  clubName: string | null;
}

// Convert HEX to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 45, s: 100, l: 51 }; // Default yellow

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Adjust lightness for better visibility
function adjustForDarkTheme(hsl: { h: number; s: number; l: number }): string {
  // Ensure the color is visible on dark background
  const adjustedL = Math.max(hsl.l, 45);
  const adjustedS = Math.min(hsl.s, 85);
  return `${hsl.h} ${adjustedS}% ${adjustedL}%`;
}

function getContrastColor(hsl: { h: number; s: number; l: number }): string {
  // If the color is light, use dark text; otherwise, use light text
  return hsl.l > 50 ? "0 0% 8%" : "0 0% 98%";
}

export function useClubTheme() {
  const { user } = useAuth();
  const [clubTheme, setClubTheme] = useState<ClubTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubTheme = async () => {
      if (!user) {
        // Reset to default theme when logged out
        resetToDefaultTheme();
        setClubTheme(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's profile to get favorite club
        const { data: profile } = await supabase
          .from("profiles")
          .select("favorite_club_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.favorite_club_id) {
          setClubTheme(null);
          setLoading(false);
          return;
        }

        // Fetch club colors
        const { data: club } = await supabase
          .from("clubs")
          .select("name, primary_color, secondary_color")
          .eq("id", profile.favorite_club_id)
          .single();

        if (club) {
          setClubTheme({
            primaryColor: club.primary_color,
            secondaryColor: club.secondary_color || club.primary_color,
            clubName: club.name,
          });

          // Apply theme to CSS variables
          applyClubTheme(club.primary_color, club.secondary_color);
        }
      } catch (error) {
        console.error("Error fetching club theme:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubTheme();
  }, [user]);

  const applyClubTheme = (primaryHex: string, secondaryHex: string | null) => {
    const root = document.documentElement;
    
    const primaryHsl = hexToHsl(primaryHex);
    const secondaryHsl = secondaryHex ? hexToHsl(secondaryHex) : primaryHsl;
    
    // Apply primary color (adjusted for visibility)
    const primaryCss = adjustForDarkTheme(primaryHsl);
    const primaryForeground = getContrastColor(primaryHsl);
    
    root.style.setProperty("--primary", primaryCss);
    root.style.setProperty("--primary-foreground", primaryForeground);
    root.style.setProperty("--foreground", primaryCss);
    root.style.setProperty("--ring", primaryCss);
    root.style.setProperty("--sidebar-primary", primaryCss);
    root.style.setProperty("--sidebar-ring", primaryCss);
    
    // Apply secondary color for accents
    const secondaryCss = adjustForDarkTheme(secondaryHsl);
    root.style.setProperty("--secondary", secondaryCss);
    root.style.setProperty("--secondary-foreground", getContrastColor(secondaryHsl));
    
    // Update gradients
    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(135deg, hsl(${primaryCss}) 0%, hsl(${secondaryCss}) 100%)`
    );
    
    // Update glow effects
    root.style.setProperty(
      "--shadow-glow",
      `0 0 30px hsl(${primaryCss} / 0.3)`
    );
  };

  const resetToDefaultTheme = () => {
    const root = document.documentElement;
    
    // Reset to default yellow theme
    root.style.setProperty("--primary", "45 100% 51%");
    root.style.setProperty("--primary-foreground", "0 0% 8%");
    root.style.setProperty("--foreground", "45 100% 51%");
    root.style.setProperty("--ring", "45 100% 51%");
    root.style.setProperty("--sidebar-primary", "45 100% 51%");
    root.style.setProperty("--sidebar-ring", "45 100% 51%");
    root.style.setProperty("--secondary", "145 63% 32%");
    root.style.setProperty("--secondary-foreground", "0 0% 98%");
    root.style.setProperty(
      "--gradient-primary",
      "linear-gradient(135deg, hsl(45, 100%, 51%) 0%, hsl(35, 100%, 45%) 100%)"
    );
    root.style.setProperty("--shadow-glow", "0 0 30px hsl(45 100% 51% / 0.3)");
  };

  return { clubTheme, loading, applyClubTheme };
}
