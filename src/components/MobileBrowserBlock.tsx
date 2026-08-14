import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAuth from "@/assets/logo-auth.png";

const useMobileBrowserBlockSetting = () => {
  return useQuery({
    queryKey: ["mobile-browser-block"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("value")
        .eq("key", "mobile_browser_block")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching mobile block setting:", error);
      }

      return data?.value === "true";
    },
    staleTime: 1000 * 60 * 2,
  });
};

const MobileBrowserBlock = ({ children }: { children: React.ReactNode }) => {
  const { data: isBlocked, isLoading } = useMobileBrowserBlockSetting();
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent;
    
    // Never block in Lovable preview or localhost
    const isPreview = window.location.hostname.includes('lovableproject.com') || 
                      window.location.hostname.includes('lovable.app') ||
                      window.location.hostname === 'localhost';
    if (isPreview) {
      setIsMobileBrowser(false);
      setIsMounted(true);
      return;
    }

    // Admin / Developer / Marketing area: always permitido em mobile para
    // que a equipe possa acessar o painel de qualquer dispositivo.
    const path = window.location.pathname;
    const isAdminArea =
      path.startsWith("/admin-access") ||
      path.startsWith("/admin") ||
      path.startsWith("/developer") ||
      path.startsWith("/desenvolvedor") ||
      path.startsWith("/marketing");
    if (isAdminArea) {
      setIsMobileBrowser(false);
      setIsMounted(true);
      return;
    }

    const isTablet =
      /iPad/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) ||
      (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
    const isMobileDevice =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && !isTablet;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Only block on actual mobile devices accessed via browser (not standalone PWA)
    setIsMobileBrowser(isMobileDevice && !isStandalone);
    setIsMounted(true);
  }, []);

  // On desktop, always show children immediately
  if (!isMounted || !isMobileBrowser) {
    return <>{children}</>;
  }

  // While loading, keep the app visible to avoid trapping preview behind an overlay
  if (isLoading) {
    return <>{children}</>;
  }

  // Setting loaded and not blocked — show children
  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] px-8 text-center">
      <img
        src={logoAuth}
        alt="Fanaticamente"
        className="mb-8 h-32 w-auto object-contain"
      />
      <h1 className="mb-3 text-xl font-bold text-white">
        Acesse pelo computador
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
        Para a melhor experiência, acesse o site pelo navegador do seu
        computador desktop ou notebook.
      </p>
    </div>
  );
};

export default MobileBrowserBlock;
