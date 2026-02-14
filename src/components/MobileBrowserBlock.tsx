import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAuth from "@/assets/logo-auth.png";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

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

      // Default to "true" (blocked) if no setting exists
      return data?.value !== "false";
    },
    staleTime: 1000 * 60 * 2,
  });
};

const MobileBrowserBlock = ({ children }: { children: React.ReactNode }) => {
  const { data: isBlocked, isLoading } = useMobileBrowserBlockSetting();

  const isMobileBrowser =
    typeof window !== "undefined" &&
    window.innerWidth < 768 &&
    !isStandalone();

  // While loading or if not mobile browser, show children
  if (!isMobileBrowser || isLoading || !isBlocked) {
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
