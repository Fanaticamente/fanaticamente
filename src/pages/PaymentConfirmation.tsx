import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, Home, CalendarCheck, Download, Shield } from "lucide-react";
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
  const priceParam = searchParams.get("price");
  const socioApplied = searchParams.get("socio") === "1";

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!id) return;

      try {
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

            if (clubData) setClub(clubData);
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
  const accentColor = clubColor;

  const sessionPrice = priceParam
    ? parseFloat(priceParam)
    : professional?.hourly_rate ?? 150;

  const professionalName = getFirstAndLastName(profile?.full_name || "");
  const formattedDate = scheduledDate
    ? format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";
  const cardDate = scheduledDate
    ? format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "";

  const handleDownload = () => {
    const content = [
      "COMPROVANTE DE AGENDAMENTO",
      "==========================",
      "",
      `Profissional: ${professionalName}`,
      `CRP: ${professional?.crp || "—"}`,
      "",
      `Data: ${formattedDate}`,
      `Horário: ${scheduledTime}`,
      "",
      socioApplied ? "Valor a pagar (com parceria aplicada)" : "Valor a pagar",
      `R$ ${sessionPrice.toFixed(2).replace(".", ",")}`,
      "",
      "Você receberá um lembrete por e-mail 24 horas antes da sessão.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agendamento-${scheduledDate || "data"}-${(scheduledTime || "hora").replace(":", "h")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: accentColor }} />
      </div>
    );
  }

  if (!professional || !scheduledDate || !scheduledTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500">Dados não encontrados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Success Icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: accentColor }}
        >
          <CheckCircle className="w-14 h-14 text-white" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 text-center normal-case">
          Agendamento concluído
        </h1>
        <p className="text-slate-500 text-center mt-1 mb-8">
          Sua sessão foi agendada com sucesso
        </p>

        {/* Session Details Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg border border-slate-100 mb-6">
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
            <div
              className="w-16 h-16 rounded-full overflow-hidden border-2"
              style={{ borderColor: accentColor }}
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
                  style={{ backgroundColor: accentColor + "20" }}
                >
                  <User className="w-8 h-8" style={{ color: accentColor }} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans font-bold text-slate-900 text-lg leading-tight">
                {professionalName}
              </h3>
              <p className="text-sm text-slate-500">CRP {professional.crp}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Calendar className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Data</p>
                <p className="font-medium text-slate-900">{cardDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Clock className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Horário</p>
                <p className="font-medium text-slate-900">{scheduledTime}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Valor a pagar</span>
                <span className="text-xl font-bold" style={{ color: accentColor }}>
                  R$ {sessionPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
              {socioApplied && (
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-xs font-semibold" style={{ color: accentColor }}>
                    Parceria aplicada
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-5 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 transition-all bg-white"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <Download className="w-4 h-4" />
            Baixar comprovante
          </button>
        </div>

        {/* Info Text */}
        <div
          className="w-full max-w-sm p-4 rounded-xl mb-6 text-center"
          style={{ backgroundColor: accentColor + "12" }}
        >
          <p className="text-sm" style={{ color: accentColor }}>
            Você receberá um lembrete por e-mail 24 horas antes da sua sessão
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate("/meus-agendamentos")}
            className="w-full py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-white"
            style={{ backgroundColor: accentColor }}
          >
            <CalendarCheck className="w-5 h-5" />
            Visualizar agendamentos
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 bg-white"
            style={{ borderColor: accentColor, color: accentColor }}
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
