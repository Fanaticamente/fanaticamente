import { useState, useEffect } from "react";
import { Lock, CreditCard, QrCode, Crown, Shield, CheckCircle } from "lucide-react";
import { Course } from "@/hooks/useCourses";
import CourseCardPaymentForm from "./CourseCardPaymentForm";
import CoursePixPayment from "./CoursePixPayment";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoursePaywallProps {
  course: Course;
  onAccessGranted: () => void;
}

type PaywallStep = "options" | "card" | "pix";
type PurchaseType = "course" | "membership";

const MEMBERSHIP_PRICE = 49.90;
const SOCIO_DISCOUNT = 0.20;

const CoursePaywall = ({ course, onAccessGranted }: CoursePaywallProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<PaywallStep>("options");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("course");

  // Sócio Consciente state
  const [clubName, setClubName] = useState<string | null>(null);
  const [clubColor, setClubColor] = useState<string>("#16a34a");
  const [socioMatricula, setSocioMatricula] = useState("");
  const [socioDiscountApplied, setSocioDiscountApplied] = useState(false);

  const coursePrice = course.price || 0;
  const discountedCoursePrice = socioDiscountApplied ? coursePrice * (1 - SOCIO_DISCOUNT) : coursePrice;
  const discountedMembershipPrice = socioDiscountApplied ? MEMBERSHIP_PRICE * (1 - SOCIO_DISCOUNT) : MEMBERSHIP_PRICE;

  // Fetch user's favorite club
  useEffect(() => {
    const fetchClub = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_club_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.favorite_club_id) {
        const { data: club } = await supabase
          .from("clubs")
          .select("name, primary_color")
          .eq("id", profile.favorite_club_id)
          .single();

        if (club) {
          setClubName(club.name);
          setClubColor(club.primary_color || "#16a34a");
        }
      }
    };
    fetchClub();
  }, [user]);

  const handleApplySocio = () => {
    if (!socioMatricula.trim() || socioMatricula.trim().length < 3) {
      toast.error("Informe uma matrícula válida");
      return;
    }
    setSocioDiscountApplied(true);
  };

  const handleSelectPayment = (type: PurchaseType, method: "card" | "pix") => {
    setPurchaseType(type);
    setStep(method);
  };

  const getPrice = (type: PurchaseType) => {
    return type === "membership" ? discountedMembershipPrice : discountedCoursePrice;
  };

  if (step === "card") {
    return (
      <CourseCardPaymentForm
        purchaseType={purchaseType}
        courseId={course.id}
        coursePrice={getPrice(purchaseType)}
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
        coursePrice={getPrice(purchaseType)}
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
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="font-sans font-semibold text-xl text-slate-900 normal-case mb-2">Conteúdo premium</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Para acessar este curso, escolha uma das opções abaixo.
        </p>
      </div>

      {/* Sócio Consciente Section */}
      {clubName && !socioDiscountApplied && (
        <div
          className="rounded-xl border p-3 space-y-2"
          style={{ backgroundColor: clubColor + "12", borderColor: clubColor + "40" }}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 flex-shrink-0" style={{ color: clubColor }} />
            <div>
              <p className="font-semibold text-slate-900 text-xs">Sócio Consciente {clubName}</p>
              <p className="text-[10px] text-slate-500">Informe sua matrícula</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={socioMatricula}
              onChange={(e) => setSocioMatricula(e.target.value)}
              placeholder="Nº da matrícula"
              maxLength={20}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1"
              style={{ borderColor: clubColor + "40" }}
            />
            <button
              onClick={handleApplySocio}
              className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
              style={{ backgroundColor: clubColor }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {clubName && socioDiscountApplied && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: clubColor + "12", borderColor: clubColor + "40" }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: clubColor }} />
            <div>
              <p className="text-xs font-bold" style={{ color: clubColor }}>Parceria aplicada</p>
              <p className="text-[10px] text-slate-500">Matrícula: {socioMatricula}</p>
            </div>
            <button
              onClick={() => { setSocioDiscountApplied(false); setSocioMatricula(""); }}
              className="ml-auto text-[10px] font-medium underline"
              style={{ color: clubColor }}
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* Option 1: Individual Purchase */}
      {coursePrice > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-sans font-semibold text-base normal-case">Compra avulsa</h3>
              <p className="text-slate-500 text-xs">Acesso vitalício a este curso</p>
            </div>
            <div className="ml-auto text-right">
              {socioDiscountApplied ? (
                <>
                  <span className="text-slate-400 line-through text-sm block">
                    R$ {coursePrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-slate-900 font-bold text-lg">
                    R$ {discountedCoursePrice.toFixed(2).replace(".", ",")}
                  </span>
                </>
              ) : (
                <span className="text-slate-900 font-bold text-lg">
                  R$ {coursePrice.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectPayment("course", "card")}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Cartão
            </button>
            <button
              onClick={() => handleSelectPayment("course", "pix")}
              className="flex-1 py-3 bg-white border border-emerald-600 text-emerald-700 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" /> PIX
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      {coursePrice > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-500 text-xs">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* Option 2: Membership */}
      <div className="bg-white border border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-slate-900 font-sans font-semibold text-base normal-case">Assinatura mensal</h3>
            <p className="text-slate-500 text-xs">Acesso a todos os cursos da plataforma</p>
          </div>
          <div className="ml-auto text-right whitespace-nowrap">
            {socioDiscountApplied ? (
              <>
                <span className="text-slate-400 line-through text-sm block">
                  R$ 49,90
                </span>
                <span className="text-slate-900 font-bold text-lg">
                  R$ {discountedMembershipPrice.toFixed(2).replace(".", ",")}
                  <span className="text-slate-500 text-xs font-normal">/mês</span>
                </span>
              </>
            ) : (
              <span className="text-slate-900 font-bold text-lg">
                R$ 49,90<span className="text-slate-500 text-xs font-normal">/mês</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectPayment("membership", "card")}
            className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-semibold text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Cartão
          </button>
          <button
            onClick={() => handleSelectPayment("membership", "pix")}
            className="flex-1 py-3 bg-white border border-amber-500 text-amber-700 rounded-lg font-semibold text-sm hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" /> PIX
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursePaywall;
