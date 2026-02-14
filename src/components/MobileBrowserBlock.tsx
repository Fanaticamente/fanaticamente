import logoAuth from "@/assets/logo-auth.png";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

const MobileBrowserBlock = ({ children }: { children: React.ReactNode }) => {
  // Only block on small screens accessed via browser (not PWA standalone)
  const isMobileBrowser =
    typeof window !== "undefined" &&
    window.innerWidth < 768 &&
    !isStandalone();

  if (isMobileBrowser) {
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
  }

  return <>{children}</>;
};

export default MobileBrowserBlock;
