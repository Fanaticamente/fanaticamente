import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, Home, MessageCircle } from "lucide-react";
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

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const scheduledDate = searchParams.get("date");
  const scheduledTime = searchParams.get("time");
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!id) return;

      try {
        const { data: professionalData, error: professionalError } = await supabase
          .from("professionals")
          .select("*")
          .eq("id", id)
          .single();

        if (professionalError || !professionalData) {
          navigate("/");
          return;
        }

        setProfessional(professionalData);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, favorite_club_id")
          .eq("user_id", professionalData.user_id)
          .single();

        if (profileData) {
          setProfile(profileData);

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
        <p className="text-gray-500">Dados não encontrados</p>
      </div>
    );
  }

  const sessionPrice = professional.hourly_rate || 150;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: clubColor + "10" }}
    >
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Success Icon */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-bounce"
          style={{ backgroundColor: clubColor }}
        >
          <CheckCircle className="w-14 h-14 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Agendamento Confirmado!
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Sua sessão foi agendada com sucesso
        </p>

        {/* Session Details Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: clubColor + "20" }}>
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <Calendar className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium text-gray-800">
                  {format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: clubColor + "20" }}
              >
                <Clock className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Horário</p>
                <p className="font-medium text-gray-800">{scheduledTime}</p>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: clubColor + "20" }}>
              <span className="text-gray-600">Valor pago</span>
              <span className="text-xl font-bold" style={{ color: clubColor }}>
                R$ {sessionPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <div 
          className="w-full max-w-sm p-4 rounded-xl mb-8 text-center"
          style={{ backgroundColor: clubColor + "20" }}
        >
          <p className="text-sm" style={{ color: clubColor }}>
            Você receberá um lembrete por e-mail 24 horas antes da sua sessão
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: clubColor, 
              color: "#fff" 
            }}
          >
            <Home className="w-5 h-5" />
            Voltar ao Início
          </button>

          <button
            onClick={() => navigate(`/terapeuta/${id}`)}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all border-2 flex items-center justify-center gap-2"
            style={{ 
              borderColor: clubColor, 
              color: clubColor,
              backgroundColor: "white"
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Ver Perfil do Terapeuta
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentConfirmation;
