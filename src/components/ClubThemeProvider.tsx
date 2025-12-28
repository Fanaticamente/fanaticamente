import { useEffect } from "react";
import { useClubTheme } from "@/hooks/useClubTheme";

interface ClubThemeProviderProps {
  children: React.ReactNode;
}

export const ClubThemeProvider = ({ children }: ClubThemeProviderProps) => {
  // This hook automatically applies the club theme when user is logged in
  useClubTheme();

  return <>{children}</>;
};
