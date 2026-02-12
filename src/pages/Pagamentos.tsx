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
    <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 md:p-8 space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wide text-white">
          Pagamentos
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Gerencie assinaturas e visualize o histórico de transações
        </p>
      </div>

      {/* Subscriptions Section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Assinaturas
          </h2>
        </div>
        <MembershipSection />
      </section>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Session Payments Section */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="w-5 h-5 text-emerald-500" />
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Histórico de Sessões
          </h2>
        </div>
        <SessionPaymentsHistory />
      </section>
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
