import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAppPages } from "@/hooks/useAppPages";
import { useAppMenu } from "@/hooks/useAppContent";
import { getMenuIcon } from "@/lib/menuIcons";

const DEFAULT_ITEMS = [
  { icon: "Home", label: "Início", path: "/" },
  { icon: "Heart", label: "Bem-estar", path: "/bem-estar" },
  { icon: "Community", label: "Comunidade", path: "/comunidade" },
  { icon: "User", label: "Você", path: "/perfil" },
];

const BottomNav = () => {
  const { data: pages } = useAppPages('mobile');
  const { data: menu } = useAppMenu("bottom_nav");
  const [slim, setSlim] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const wake = () => {
      setSlim(false);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSlim(true), 1500);
    };
    wake();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", wake, opts);
    window.addEventListener("touchstart", wake, opts);
    window.addEventListener("touchmove", wake, opts);
    window.addEventListener("pointermove", wake, opts);
    window.addEventListener("wheel", wake, opts);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("touchmove", wake);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("wheel", wake);
    };
  }, []);

  const navItems = menu?.items?.length ? menu.items : DEFAULT_ITEMS;

  const visibleItems = navItems.filter((item) => {
    if (!pages || pages.length === 0) return true;
    const page = pages.find((p) => p.path === item.path);
    return page ? page.is_visible !== false : true;
  });

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu will-change-transform font-sans transition-all duration-300 ease-out ${
        slim ? "bottom-2" : "bottom-4"
      }`}
    >
      <nav
        className={`backdrop-blur-xl border rounded-full mx-auto transition-all duration-300 ease-out ${
          slim
            ? "bg-white/15 border-white/15 shadow-sm scale-[0.82] opacity-70"
            : "bg-white/75 border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.1)] scale-100 opacity-100"
        }`}
      >
        <div className={`flex items-center justify-between transition-all duration-300 ${slim ? "gap-4 px-5 py-2" : "gap-8 px-8 py-3"}`}>
          {visibleItems.map((item) => {
            const IconComponent = getMenuIcon(item.icon);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center rounded-full transition-all ${
                    slim ? "w-10 h-10" : "w-12 h-14"
                  } ${
                    isActive
                      ? "text-[var(--club-600)]"
                      : "text-slate-500 hover:text-slate-700"
                  }`
                }
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <IconComponent
                      className={`transition-all ${slim ? "w-5 h-5" : "w-6 h-6"} ${
                        isActive ? "scale-110" : ""
                      }`}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    {!slim && (
                      <span className="text-[10px] font-medium leading-tight mt-0.5 whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;