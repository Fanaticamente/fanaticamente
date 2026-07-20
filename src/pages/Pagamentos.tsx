import { useIsMobile } from "@/hooks/use-mobile";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MembershipSection from "@/components/pagamentos/MembershipSection";
import SessionPaymentsHistory from "@/components/pagamentos/SessionPaymentsHistory";
import { Crown, Receipt } from "lucide-react";

const Pagamentos = () => {
  const isMobile = useIsMobile();

  const PageContent = () => (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5" style={{ color: "var(--club-600)" }} />
          <h2 className="font-sans font-semibold text-lg text-slate-900 normal-case">
            Assinaturas
          </h2>
        </div>
        <MembershipSection />
      </section>

      <div className="border-t border-slate-200" />

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5" style={{ color: "var(--club-600)" }} />
          <h2 className="font-sans font-semibold text-lg text-slate-900 normal-case">
            Extrato de pagamentos
          </h2>
        </div>
        <SessionPaymentsHistory />
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <Header title="Pagamentos" hideSearch />
        <main className="px-4 pt-20 pb-8">
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
