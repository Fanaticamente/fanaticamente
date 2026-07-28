import Header from "@/components/layout/Header";
import MinimalHome from "@/components/home/MinimalHome";
import BottomNav from "@/components/layout/BottomNav";

/**
 * Static mobile view for the Content Manager.
 * Mirrors the real mobile home (MinimalHome) driven by the app_modules config.
 */
const StaticMobileView = () => {
  return (
    <div className="h-full overflow-y-auto bg-background relative">
      <Header />
      <main className="pb-28">
        <MinimalHome />
      </main>
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
};

export default StaticMobileView;
