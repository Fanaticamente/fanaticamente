import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashImage from "@/assets/splash-screen.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
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
    // Only show on mobile and only once per session
    if (typeof window === "undefined") return false;
    const isMobile = window.innerWidth < 768;
    const alreadyShown = sessionStorage.getItem("fanatica_splash_shown");
    return isMobile && !alreadyShown;
  });

  const handleFinish = () => {
    sessionStorage.setItem("fanatica_splash_shown", "1");
    setShowSplash(false);
  };

  const SplashElement = showSplash ? (
    <AnimatePresence>
      <SplashScreen onFinish={handleFinish} />
    </AnimatePresence>
  ) : null;

  return { SplashElement, showSplash };
};

export default SplashScreen;
