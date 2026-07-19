import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, Home, CalendarCheck, Download, Shield, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFirstAndLastName } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

interface Professional {
  id: string;
  crp: string | null;
  degree: string | null;
  hourly_rate: number | null;
  user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  favorite_club_id: string | null;
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

        setProfessional(professionalData as Professional);

        if (professionalData.favorite_club_id) {
          const { data: clubData } = await supabase
            .from("clubs")
            .select("*")
            .eq("id", professionalData.favorite_club_id)
            .maybeSingle();
          if (clubData) setClub(clubData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [id, navigate]);

  const clubColor = club?.primary_color || "#0f172a";
  const accentColor = clubColor;

  const sessionPrice = priceParam
    ? parseFloat(priceParam)
    : professional?.hourly_rate ?? 150;

  const professionalName = getFirstAndLastName(professional?.full_name || "");
  const formattedDate = scheduledDate
    ? format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";
  const cardDate = scheduledDate
    ? format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "";

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const rgb = hexToRgb(accentColor);

    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(0, 0, pageWidth, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Comprovante de agendamento", 40, 50);

    let y = 130;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Profissional", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(professionalName || "—", 40, y + 18);
    if (professional?.crp) doc.text(`CRP ${professional.crp}`, 40, y + 36);

    y += 80;
    doc.setFont("helvetica", "bold");
    doc.text("Data", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(formattedDate, 40, y + 18);

    y += 50;
    doc.setFont("helvetica", "bold");
    doc.text("Horário", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(scheduledTime || "—", 40, y + 18);

    y += 50;
    doc.setFont("helvetica", "bold");
    doc.text("Modalidade", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text("Atendimento on-line", 40, y + 18);

    y += 60;
    doc.setDrawColor(220, 220, 220);
    doc.line(40, y, pageWidth - 40, y);
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.text("Valor a pagar", 40, y);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.setFontSize(16);
    doc.text(`R$ ${sessionPrice.toFixed(2).replace(".", ",")}`, pageWidth - 40, y, { align: "right" });
    if (socioApplied) {
      doc.setFontSize(11);
      doc.text("Parceria Sócio Consciente aplicada", 40, y + 20);
    }

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(
      "Você receberá um lembrete por e-mail 24 horas antes da sua sessão.",
      40,
      y + 60,
    );

    doc.save(`agendamento-${scheduledDate || "data"}-${(scheduledTime || "hora").replace(":", "h")}.pdf`);
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
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-5">
        {/* Success Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: accentColor }}
        >
          <CheckCircle className="w-9 h-9 text-white" />
        </div>

        <h1 className="font-sans text-xl font-extrabold text-slate-900 text-center normal-case tracking-normal">
          Agendamento concluído!
        </h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-4">
          Sua sessão foi agendada com sucesso
        </p>

        {/* Session Details Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-lg border border-slate-100 mb-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div
              className="w-14 h-14 rounded-full overflow-hidden border-2 shrink-0"
              style={{ borderColor: accentColor }}
            >
              {professional?.avatar_url ? (
                <img
                  src={professional.avatar_url}
                  alt={professional?.full_name || "Profissional"}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor + "20" }}
                >
                  <User className="w-7 h-7" style={{ color: accentColor }} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans font-bold text-slate-900 text-base leading-tight normal-case">
                {professionalName || "Profissional"}
              </h3>
              {professional.crp && (
                <p className="text-xs text-slate-500">CRP {professional.crp}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Data</p>
                <p className="text-sm font-medium text-slate-900">{cardDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Clock className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Horário</p>
                <p className="text-sm font-medium text-slate-900">{scheduledTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentColor + "15" }}
              >
                <Video className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Modalidade</p>
                <p className="text-sm font-medium text-slate-900">Atendimento on-line</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Valor a pagar</span>
                <span className="text-lg font-bold" style={{ color: accentColor }}>
                  R$ {sessionPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
              {socioApplied && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Shield className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-xs font-semibold" style={{ color: accentColor }}>
                    Parceria Sócio Consciente aplicada
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 transition-all bg-white text-sm"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <Download className="w-4 h-4" />
            Baixar comprovante
          </button>
        </div>

        {/* Info Text */}
        <div
          className="w-full max-w-sm p-3 rounded-xl mb-4 text-center"
          style={{ backgroundColor: accentColor + "12" }}
        >
          <p className="text-xs" style={{ color: accentColor }}>
            Você receberá um lembrete por e-mail 24 horas antes da sua sessão
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-2.5">
          <button
            onClick={() => navigate("/meus-agendamentos")}
            className="w-full py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-white text-sm"
            style={{ backgroundColor: accentColor }}
          >
            <CalendarCheck className="w-4 h-4" />
            Visualizar agendamentos
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 bg-white text-sm"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <Home className="w-4 h-4" />
            Voltar para o início
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentConfirmation;
