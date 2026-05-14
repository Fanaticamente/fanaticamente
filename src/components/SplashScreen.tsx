import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashImage from "@/assets/splash-screen.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [dissolving, setDissolving] = useState(false);

  useEffect(() => {
    const dissolveTimer = setTimeout(() => setDissolving(true), 2000);
    // Hard fallback: if for any reason the dissolve animation never fires
    // onAnimationComplete (tab backgrounded, framer-motion glitch, image
    // failed to load, etc.), force-finish after 5s so the user is never
    // trapped on a black screen.
    const hardTimer = setTimeout(() => onFinish(), 5000);
    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(hardTimer);
    };
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: dissolving ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (dissolving) onFinish();
      }}
      onClick={() => onFinish()}
    >
      <img
        src={splashImage}
        alt="Fanaticamente"
        className="h-full w-full object-cover"
        onError={() => onFinish()}
      />
    </motion.div>
  );
};

export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    const isPreview =
      hostname.includes("lovableproject.com") ||
      hostname.includes("lovable.app") ||
      hostname === "localhost";
    if (isPreview) return false;
    const isMobile = window.innerWidth < 768;
    const alreadyShown = sessionStorage.getItem("fanatica_splash_shown");
    return isMobile && !alreadyShown;
  });

  const handleFinish = useCallback(() => {
    sessionStorage.setItem("fanatica_splash_shown", "1");
    setShowSplash(false);
  }, []);

  const SplashElement = (
    <AnimatePresence>
      {showSplash && <SplashScreen key="splash" onFinish={handleFinish} />}
    </AnimatePresence>
  );

  return { SplashElement, showSplash };
};

export default SplashScreen;
