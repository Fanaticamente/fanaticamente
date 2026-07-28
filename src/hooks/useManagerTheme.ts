import { useEffect } from "react";

/** Applies the unified light "manager" design system to admin/content manager pages. */
export const useManagerTheme = () => {
  useEffect(() => {
    document.documentElement.classList.add("manager-theme");
    return () => document.documentElement.classList.remove("manager-theme");
  }, []);
};