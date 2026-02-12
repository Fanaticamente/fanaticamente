import { useState } from "react";
import { Lock, CreditCard, QrCode, ArrowLeft, Crown } from "lucide-react";
import { Course } from "@/hooks/useCourses";
import CourseCardPaymentForm from "./CourseCardPaymentForm";
import CoursePixPayment from "./CoursePixPayment";

interface CoursePaywallProps {
  course: Course;
  onAccessGranted: () => void;
}

type PaywallStep = "options" | "card" | "pix";
type PurchaseType = "course" | "membership";

const MEMBERSHIP_PRICE = 49.90;

const CoursePaywall = ({ course, onAccessGranted }: CoursePaywallProps) => {
  const [step, setStep] = useState<PaywallStep>("options");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("course");

  const coursePrice = course.price || 0;

  const handleSelectPayment = (type: PurchaseType, method: "card" | "pix") => {
    setPurchaseType(type);
    setStep(method);
  };

  if (step === "card") {
    return (
      <CourseCardPaymentForm
        purchaseType={purchaseType}
        courseId={course.id}
        coursePrice={purchaseType === "membership" ? MEMBERSHIP_PRICE : coursePrice}
        label={purchaseType === "membership" ? "Assinatura Mensal" : course.title}
        onBack={() => setStep("options")}
        onSuccess={onAccessGranted}
      />
    );
  }

  if (step === "pix") {
    return (
      <CoursePixPayment
        purchaseType={purchaseType}
        courseId={course.id}
        coursePrice={purchaseType === "membership" ? MEMBERSHIP_PRICE : coursePrice}
        label={purchaseType === "membership" ? "Assinatura Mensal" : course.title}
        onBack={() => setStep("options")}
        onSuccess={onAccessGranted}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Lock Banner */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display text-xl text-white mb-2">Conteúdo Premium</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Para acessar este curso, escolha uma das opções abaixo.
        </p>
      </div>

      {/* Option 1: Individual Purchase */}
      {coursePrice > 0 && (
        <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-display text-lg uppercase tracking-wide">Compra Avulsa</h3>
              <p className="text-muted-foreground text-xs">Acesso vitalício a este curso</p>
            </div>
            <span className="ml-auto text-white font-bold text-lg">
              R$ {coursePrice.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectPayment("course", "card")}
              className="flex-1 py-3 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Cartão
            </button>
            <button
              onClick={() => handleSelectPayment("course", "pix")}
              className="flex-1 py-3 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" /> PIX
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      {coursePrice > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Option 2: Membership */}
      <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-display text-lg uppercase tracking-wide">Assinatura Mensal</h3>
            <p className="text-muted-foreground text-xs">Acesso a todos os cursos da plataforma</p>
          </div>
          <span className="ml-auto text-white font-bold text-lg whitespace-nowrap">
            R$ 49,90<span className="text-muted-foreground text-xs font-normal">/mês</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectPayment("membership", "card")}
            className="flex-1 py-3 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Cartão
          </button>
          <button
            onClick={() => handleSelectPayment("membership", "pix")}
            className="flex-1 py-3 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" /> PIX
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursePaywall;
