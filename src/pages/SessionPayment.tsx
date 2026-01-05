import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Clock, User, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Professional {
  id: string;
  crp: string;
  degree: string | null;
  hourly_rate: number | null;
  user_id: string;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
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
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const scheduledDate = searchParams.get("date");
  const scheduledTime = searchParams.get("time");
  const canceled = searchParams.get("canceled");
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (canceled === "true") {
      toast.info("Pagamento cancelado");
    }
  }, [canceled]);

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

        setProfessional(professionalData as Professional);

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
  const canProcessPayment = professional?.stripe_account_status === "active";

  const handlePayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar uma sessão");
      navigate("/auth");
      return;
    }

    if (!canProcessPayment) {
      toast.error("Este profissional ainda não configurou o recebimento de pagamentos");
      return;
    }

    setProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: {
          professionalId: id,
          scheduledDate,
          scheduledTime,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de pagamento não recebida");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setProcessing(false);
    }
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

        {/* Payment Method Card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Formas de Pagamento</h2>
          
          <div className="space-y-3">
            <div 
              className="p-4 rounded-xl border flex items-center gap-4"
              style={{ borderColor: clubColor + "40" }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <CreditCard className="w-6 h-6" style={{ color: clubColor }} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Cartão de Crédito</p>
                <p className="text-sm text-gray-500">Visa, Mastercard, Elo e outros</p>
              </div>
            </div>
            
            <div 
              className="p-4 rounded-xl border flex items-center gap-4"
              style={{ borderColor: clubColor + "40" }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <svg className="w-6 h-6" style={{ color: clubColor }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.5 4h5l1 1.5L12 10l-3.5-4.5L9.5 4zM4 9.5l1.5-1L10 12l-4.5 3.5L4 14.5v-5zM14.5 20h-5l-1-1.5L12 14l3.5 4.5-1 1.5zM20 14.5l-1.5 1L14 12l4.5-3.5 1.5 1v5z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">PIX</p>
                <p className="text-sm text-gray-500">Pagamento instantâneo</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Você escolherá o método de pagamento na próxima tela
          </p>
        </div>

        {/* Warning if professional hasn't set up Stripe Connect */}
        {!canProcessPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Profissional ainda não configurou pagamentos</p>
              <p className="text-sm text-amber-600 mt-1">
                Este profissional precisa configurar sua conta de recebimento antes de aceitar pagamentos online.
              </p>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400">
            O pagamento será processado após a confirmação da sessão pelo profissional.
          </p>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing || !canProcessPayment}
          className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg disabled:opacity-70"
          style={{ 
            backgroundColor: clubColor, 
            color: "#fff" 
          }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecionando...
            </span>
          ) : (
            `Pagar R$ ${sessionPrice.toFixed(2).replace(".", ",")}`
          )}
        </button>
      </main>
    </div>
  );
};

export default SessionPayment;
