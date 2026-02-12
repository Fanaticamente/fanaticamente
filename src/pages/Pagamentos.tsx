import { useIsMobile } from "@/hooks/use-mobile";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MembershipSection from "@/components/pagamentos/MembershipSection";
import { Crown } from "lucide-react";

const Pagamentos = () => {
  const isMobile = useIsMobile();

  const PageContent = () => (
    <div className="space-y-6">
      {/* Page Hero */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Minhas Assinaturas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seus planos e histórico
          </p>
        </div>
      </div>

      {/* Membership Section */}
      <MembershipSection />
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container py-4 pt-20">
          <PageContent />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Pagamentos" subtitle="Gerencie suas assinaturas e histórico de transações">
      <PageContent />
    </UserDesktopLayout>
  );
};

export default Pagamentos;
