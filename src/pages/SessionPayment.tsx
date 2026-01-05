import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, QrCode, Copy, Check, Clock, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Professional {
  id: string;
  crp: string;
  degree: string | null;
  hourly_rate: number | null;
  user_id: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Club {
  id: string;
  name: string;
  primary_color: string;
  badge_url: string | null;
}

const SessionPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const scheduledDate = searchParams.get("date");
  const scheduledTime = searchParams.get("time");
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!id) return;

      try {
        // Fetch professional data
        const { data: professionalData, error: professionalError } = await supabase
          .from("professionals")
          .select("*")
          .eq("id", id)
          .single();

        if (professionalError || !professionalData) {
          navigate(-1);
          return;
        }

        setProfessional(professionalData);

        // Fetch profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, favorite_club_id")
          .eq("user_id", professionalData.user_id)
          .single();

        if (profileData) {
          setProfile(profileData);

          // Fetch club data
          if (profileData.favorite_club_id) {
            const { data: clubData } = await supabase
              .from("clubs")
              .select("*")
              .eq("id", profileData.favorite_club_id)
              .single();

            if (clubData) {
              setClub(clubData);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [id, navigate]);

  const clubColor = club?.primary_color || "#10b981";

  const handleCopyPix = () => {
    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136example-pix-key-here5204000053039865802BR5913Fanatica Saude6008BRASILIA62070503***6304ABCD");
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      navigate(`/pagamento/confirmacao/${id}?date=${scheduledDate}&time=${scheduledTime}`);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: clubColor }} />
      </div>
    );
  }

  if (!professional || !profile || !scheduledDate || !scheduledTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Dados da sessão não encontrados</p>
      </div>
    );
  }

  const sessionPrice = professional.hourly_rate || 150;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-4 py-4 flex items-center gap-3"
        style={{ backgroundColor: clubColor }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Pagamento da Sessão</h1>
      </header>

      <main className="p-4 pb-24">
        {/* Session Summary Card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Resumo da Sessão</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full overflow-hidden border-2"
              style={{ borderColor: clubColor }}
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || "Profissional"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: clubColor + "20" }}
                >
                  <User className="w-8 h-8" style={{ color: clubColor }} />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{profile.full_name}</h3>
              <p className="text-sm text-gray-500">CRP {professional.crp}</p>
              {professional.degree && (
                <p className="text-sm text-gray-500">{professional.degree}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4" style={{ borderColor: clubColor + "20" }}>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" style={{ color: clubColor }} />
              <span className="text-gray-700">
                {format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: clubColor }} />
              <span className="text-gray-700">{scheduledTime}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: clubColor + "20" }}>
            <span className="text-gray-600">Valor da sessão</span>
            <span className="text-2xl font-bold" style={{ color: clubColor }}>
              R$ {sessionPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Forma de Pagamento</h2>
          
          <div className="space-y-3">
            {/* Credit Card Option */}
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                paymentMethod === "card" ? "border-2" : "border-gray-200"
              }`}
              style={{ 
                borderColor: paymentMethod === "card" ? clubColor : undefined,
                backgroundColor: paymentMethod === "card" ? clubColor + "10" : undefined
              }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <CreditCard className="w-6 h-6" style={{ color: clubColor }} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Cartão de Crédito</p>
                <p className="text-sm text-gray-500">Pagamento seguro via cartão</p>
              </div>
            </button>

            {/* PIX Option */}
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                paymentMethod === "pix" ? "border-2" : "border-gray-200"
              }`}
              style={{ 
                borderColor: paymentMethod === "pix" ? clubColor : undefined,
                backgroundColor: paymentMethod === "pix" ? clubColor + "10" : undefined
              }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <QrCode className="w-6 h-6" style={{ color: clubColor }} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">PIX</p>
                <p className="text-sm text-gray-500">Pagamento instantâneo</p>
              </div>
            </button>
          </div>
        </div>

        {/* Card Payment Form */}
        {paymentMethod === "card" && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Dados do Cartão</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="Nome como está no cartão"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIX Payment */}
        {paymentMethod === "pix" && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Pague com PIX</h3>
            
            <div className="flex flex-col items-center">
              {/* QR Code Placeholder */}
              <div 
                className="w-48 h-48 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: clubColor + "10" }}
              >
                <QrCode className="w-32 h-32" style={{ color: clubColor }} />
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                Escaneie o QR Code acima ou copie o código PIX abaixo
              </p>

              <button
                onClick={handleCopyPix}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
                style={{ 
                  backgroundColor: pixCopied ? "#10b981" : clubColor + "20",
                  color: pixCopied ? "#fff" : clubColor
                }}
              >
                {pixCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Código PIX
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                O pagamento será confirmado automaticamente em até 5 minutos
              </p>
            </div>
          </div>
        )}

        {/* Payment Button */}
        {paymentMethod && (
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg disabled:opacity-70"
            style={{ 
              backgroundColor: clubColor, 
              color: "#fff" 
            }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </span>
            ) : paymentMethod === "pix" ? (
              "Já Fiz o Pagamento"
            ) : (
              `Pagar R$ ${sessionPrice.toFixed(2).replace(".", ",")}`
            )}
          </button>
        )}
      </main>
    </div>
  );
};

export default SessionPayment;
