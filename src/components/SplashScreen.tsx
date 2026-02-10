import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashImage from "@/assets/splash-screen.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [dissolving, setDissolving] = useState(false);

  useEffect(() => {
    const dissolveTimer = setTimeout(() => setDissolving(true), 2000);
    return () => clearTimeout(dissolveTimer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      initial={{ opacity: 1 }}
      animate={{ opacity: dissolving ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (dissolving) onFinish();
      }}
    >
      <img
        src={splashImage}
        alt="Fanaticamente"
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
};

export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
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
