import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getClubById } from "@/data/brazilianClubs";

// Brand fallback green (used when the user has no favorite club yet).
const FALLBACK_PRIMARY = "#237B0E";

interface ClubThemeContextType {
  clubId: string | null;
  primaryColor: string;
  refresh: () => void;
}

const ClubThemeContext = createContext<ClubThemeContextType | undefined>(undefined);

// ------- Color utilities -------
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, withHex: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(withHex);
  return rgbToHex(
    r1 * (1 - weight) + r2 * weight,
    g1 * (1 - weight) + g2 * weight,
    b1 * (1 - weight) + b2 * weight,
  );
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function onColor(hex: string): string {
  return luminance(hex) > 0.55 ? "#111827" : "#FFFFFF";
}

function applyClubVars(primary: string) {
  const root = document.documentElement;
  const shades: Record<string, string> = {
    "--club-50":  mix(primary, "#FFFFFF", 0.92),
    "--club-100": mix(primary, "#FFFFFF", 0.85),
    "--club-200": mix(primary, "#FFFFFF", 0.70),
    "--club-300": mix(primary, "#FFFFFF", 0.50),
    "--club-400": mix(primary, "#FFFFFF", 0.25),
    "--club-500": primary,
    "--club-600": mix(primary, "#000000", 0.12),
    "--club-700": mix(primary, "#000000", 0.25),
    "--club-primary": primary,
    "--club-primary-soft": mix(primary, "#FFFFFF", 0.88),
    "--club-on": onColor(primary),
  };
  Object.entries(shades).forEach(([k, v]) => root.style.setProperty(k, v));
}

// Apply cached club colors as early as possible (module import) to avoid a
// flash of the default green before React mounts and reads the profile.
if (typeof window !== "undefined") {
  try {
    const cachedId = localStorage.getItem("club-theme:clubId");
    if (cachedId) {
      const club = getClubById(cachedId);
      if (club?.primaryColor) applyClubVars(club.primaryColor);
      else applyClubVars(FALLBACK_PRIMARY);
    } else {
      applyClubVars(FALLBACK_PRIMARY);
    }
  } catch {
    applyClubVars(FALLBACK_PRIMARY);
  }
}

export const ClubThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [clubId, setClubId] = useState<string | null>(() => {
    try { return localStorage.getItem("club-theme:clubId"); } catch { return null; }
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // During session hydration `user` is temporarily null. Keep the cached
      // club theme on screen instead of replacing it with the brand fallback.
      if (authLoading) return;
      if (!user) {
        if (!cancelled) {
          setClubId(null);
          try { localStorage.removeItem("club-theme:clubId"); } catch {}
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("favorite_club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        const next = data?.favorite_club_id ?? null;
        setClubId(next);
        try {
          if (next) localStorage.setItem("club-theme:clubId", next);
          else localStorage.removeItem("club-theme:clubId");
        } catch {}
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, authLoading, tick]);

  const primaryColor = useMemo(() => {
    if (!clubId) return FALLBACK_PRIMARY;
    const club = getClubById(clubId);
    return club?.primaryColor || FALLBACK_PRIMARY;
  }, [clubId]);

  useEffect(() => {
    applyClubVars(primaryColor);
  }, [primaryColor]);

  // Listen for profile changes elsewhere in the app.
  useEffect(() => {
    const handler = () => setTick((n) => n + 1);
    window.addEventListener("club-theme-refresh", handler);
    return () => window.removeEventListener("club-theme-refresh", handler);
  }, []);

  const value = useMemo(
    () => ({
      clubId,
      primaryColor,
      refresh: () => setTick((n) => n + 1),
    }),
    [clubId, primaryColor],
  );

  return <ClubThemeContext.Provider value={value}>{children}</ClubThemeContext.Provider>;
};

export function useClubTheme() {
  const ctx = useContext(ClubThemeContext);
  if (!ctx) {
    // Safe default outside provider (e.g. in isolated tests).
    return { clubId: null, primaryColor: FALLBACK_PRIMARY, refresh: () => {} };
  }
  return ctx;
}

// Convenience: emit this event after the user updates their favorite club
// so the theme reloads immediately without a full app refresh.
export function notifyClubThemeChange() {
  window.dispatchEvent(new CustomEvent("club-theme-refresh"));
}