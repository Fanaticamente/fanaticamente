import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, Home, CalendarCheck, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFirstAndLastName } from "@/lib/utils";
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
        // Usando VIEW pública segura que não expõe dados sensíveis
        const { data: professionalData, error: professionalError } = await supabase
          .from("professionals_public")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (professionalError || !professionalData) {
          navigate("/");
          return;
        }

        setProfessional(professionalData);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, favorite_club_id")
          .eq("user_id", professionalData.user_id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);

          if (profileData.favorite_club_id) {
            const { data: clubData } = await supabase
              .from("clubs")
              .select("*")
              .eq("id", profileData.favorite_club_id)
              .maybeSingle();

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

  if (!professional || !scheduledDate || !scheduledTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Dados não encontrados</p>
      </div>
    );
  }

  const sessionPrice = professional.hourly_rate || 150;

  const professionalName = getFirstAndLastName(profile?.full_name || "");
  const formattedDate = format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handleDownload = () => {
    const content = [
      "COMPROVANTE DE AGENDAMENTO",
      "==========================",
      "",
      `Profissional: ${professionalName}`,
      `CRP: ${professional.crp}`,
      "",
      `Data: ${formattedDate}`,
      `Horário: ${scheduledTime}`,
      "",
      `Valor: R$ ${sessionPrice.toFixed(2).replace(".", ",")}`,
      "",
      "Você receberá um lembrete por e-mail 24 horas antes da sessão.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agendamento-${scheduledDate}-${scheduledTime.replace(":", "h")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Agendamento Confirmado!
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Sua sessão foi agendada com sucesso
        </p>

        {/* Session Details Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: clubColor + "20" }}>
            <div 
              className="w-16 h-16 rounded-full overflow-hidden border-2"
              style={{ borderColor: clubColor }}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.full_name || "Profissional"} 
                  className="w-full h-full object-cover object-top"
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
              <h3 className="font-bold text-gray-800 text-xl font-sans capitalize">{professionalName.toLowerCase()}</h3>
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

          <button
            onClick={handleDownload}
            className="mt-6 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 transition-all"
            style={{ borderColor: clubColor, color: clubColor, backgroundColor: "white" }}
          >
            <Download className="w-4 h-4" />
            Baixar comprovante
          </button>
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
            onClick={() => navigate("/meus-agendamentos")}
            className="w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: clubColor, color: "#fff" }}
          >
            <CalendarCheck className="w-5 h-5" />
            Visualizar agendamentos
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2"
            style={{ borderColor: clubColor, color: clubColor, backgroundColor: "white" }}
          >
            <Home className="w-5 h-5" />
            Voltar para o início
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentConfirmation;
