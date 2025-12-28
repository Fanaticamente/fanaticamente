import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import DynamicModule from "@/components/home/DynamicModule";
import { useAppModules } from "@/hooks/useAppModules";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { data: modules, isLoading } = useAppModules("home");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14">
        {isLoading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          modules?.map((module) => (
            <DynamicModule key={module.id} module={module} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
