import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Clock, User, Calendar, AlertCircle, Loader2, Copy, Check, QrCode, Upload, FileText, X, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import BookingTermsDialog from "@/components/booking/BookingTermsDialog";

// Interface para dados públicos do profissional (da VIEW professionals_public)
interface ProfessionalPublic {
  id: string;
  crp: string;
  degree: string | null;
  hourly_rate: number | null;
  user_id: string;
  bio: string | null;
  location: string | null;
  specialties: string[] | null;
  experience_years: number | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  approval_status: string | null;
  google_calendar_url: string | null;
  socio_consciente: boolean | null;
  created_at: string;
  updated_at: string;
}

// Interface para dados sensíveis de pagamento (acessível apenas para usuários autenticados)
interface ProfessionalPaymentInfo {
  stripe_account_status: string | null;
  pix_key: string | null;
}

// Combinação de dados públicos + dados de pagamento
type Professional = ProfessionalPublic & Partial<ProfessionalPaymentInfo>;

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

type PaymentMethod = "card" | "pix" | null;

// Generate PIX EMV Code (BR Code / EMV)
const generatePixCode = (
  pixKey: string,
  amount: number,
  merchantName: string,
  txid: string,
  merchantCity = "SAO PAULO"
): string => {
  const onlyAscii = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9 \-\.\/]/g, "")
      .trim();

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", onlyAscii(pixKey));
  const merchantAccountInfo = formatField("26", gui + key);

  const payloadFormatIndicator = formatField("00", "01");
  const merchantCategoryCode = formatField("52", "0000");
  const transactionCurrency = formatField("53", "986");

  const amountStr = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const transactionAmount = formatField("54", amountStr);

  const countryCode = formatField("58", "BR");
  const name = formatField("59", onlyAscii(merchantName).substring(0, 25));
  const city = formatField("60", onlyAscii(merchantCity).substring(0, 15) || "SAO PAULO");

  const safeTxid = onlyAscii(txid).replace(/\s+/g, "").substring(0, 25) || "***";
  const additionalData = formatField("62", formatField("05", safeTxid));

  const payloadNoCrc =
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    name +
    city +
    additionalData +
    "6304";

  const crc16ccitt = (str: string): string => {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  };

  return payloadNoCrc + crc16ccitt(payloadNoCrc);
};

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socioMatricula, setSocioMatricula] = useState("");
  const [socioDiscountApplied, setSocioDiscountApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (canceled === "true") {
      toast.info("Pagamento cancelado");
    }
  }, [canceled]);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!id) return;

      try {
        const { data: professionalData, error: professionalError } = await supabase
          .from("professionals_public")
          .select("*")
          .eq("id", id)
          .single();

        if (professionalError || !professionalData) {
          navigate(-1);
          return;
        }

        const { data: paymentInfo } = await supabase
          .from("professionals")
          .select("stripe_account_status, pix_key")
          .eq("id", id)
          .single();

        const fullProfessionalData: Professional = {
          ...professionalData,
          stripe_account_status: paymentInfo?.stripe_account_status ?? null,
          pix_key: paymentInfo?.pix_key ?? null,
        };

        setProfessional(fullProfessionalData);

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
  const canProcessStripe = professional?.stripe_account_status === "active";
  const hasPixKey = !!professional?.pix_key;

  const handleCardPayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar uma sessão");
      navigate("/auth");
      return;
    }

    if (!canProcessStripe) {
      toast.error("Este profissional ainda não configurou o recebimento via cartão");
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

  const handleCopyPix = () => {
    if (!professional?.pix_key || !profile?.full_name || !scheduledDate || !scheduledTime) return;

    const txid = `SESS${(id ?? "").replace(/-/g, "").slice(0, 8)}${scheduledDate.replace(/-/g, "").slice(2)}${scheduledTime.replace(":", "")}`;

    const pixCode = generatePixCode(
      professional.pix_key,
      sessionPrice,
      profile.full_name,
      txid
    );

    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleShowReceiptUpload = () => {
    setShowReceiptUpload(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato inválido. Envie uma imagem ou PDF.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmAppointment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      navigate("/auth");
      return;
    }

    if (!receiptFile) {
      toast.error("Por favor, envie o comprovante de pagamento");
      return;
    }

    setUploadingReceipt(true);

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-receipt.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: createdApt, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          status: 'pending',
          receipt_url: fileName,
        })
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      // Push event to professional's Google Calendar (best-effort)
      if (createdApt?.id) {
        supabase.functions.invoke('google-calendar-create-event', {
          body: { appointment_id: createdApt.id },
        }).catch((err) => console.warn('gcal create-event failed', err));
      }

      toast.success("Agendamento enviado! O profissional irá verificar o comprovante.");
      navigate(`/pagamento/confirmacao/${id}?date=${scheduledDate}&time=${scheduledTime}`);
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Erro ao enviar agendamento. Tente novamente.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
          style={{ borderColor: clubColor, borderTopColor: 'transparent' }} 
        />
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

  const basePrice = professional.hourly_rate || 150;
  const isSocioConsciente = professional.socio_consciente && socioDiscountApplied;
  const discountAmount = isSocioConsciente ? basePrice * 0.15 : 0;
  const sessionPrice = basePrice - discountAmount;
  const txid = `SESS${(id ?? "").replace(/-/g, "").slice(0, 8)}${scheduledDate.replace(/-/g, "").slice(2)}${scheduledTime.replace(":", "")}`;

  const handleApplySocioDiscount = () => {
    if (!socioMatricula.trim() || socioMatricula.trim().length < 3) {
      toast.error("Informe uma matrícula válida");
      return;
    }
    setSocioDiscountApplied(true);
    // Toast removed per design request
  };

  const handleRemoveSocioDiscount = () => {
    setSocioDiscountApplied(false);
    setSocioMatricula("");
  };

  const pixCode = professional.pix_key && profile.full_name
    ? generatePixCode(professional.pix_key, sessionPrice, profile.full_name, txid)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div 
        className="pt-4 pb-8"
        style={{ 
          background: `linear-gradient(135deg, ${clubColor} 0%, ${clubColor}dd 100%)`
        }}
      >
        <div className="px-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Confirmar Agendamento</h1>
            <p className="text-white/70 text-sm">Complete o pagamento</p>
          </div>
        </div>
      </div>

      <main className="px-4 -mt-4 pb-8 space-y-4">
        {/* Session Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Professional Info Header */}
          <div className="p-5 flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-2xl overflow-hidden border-2"
                style={{ borderColor: clubColor + '40' }}
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
                    style={{ backgroundColor: clubColor + '15' }}
                  >
                    <User className="w-8 h-8" style={{ color: clubColor }} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-sans font-bold text-gray-800 text-xl">{profile.full_name}</h3>
              <p className="text-gray-500 text-sm">{professional.degree || 'Psicólogo(a)'}</p>
              <p className="text-gray-400 text-xs">CRP: {professional.crp}</p>
            </div>
          </div>

          {/* Divider with decorative elements */}
          <div className="relative px-5">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-r-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-l-full" />
            <div className="border-t-2 border-dashed border-gray-200" />
          </div>

          {/* Date, Time & Price */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '12' }}
              >
                <Calendar className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Data</p>
                <p className="text-gray-900 font-semibold">
                  {format(parseISO(scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '12' }}
              >
                <Clock className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Horário</p>
                <p className="text-gray-900 font-semibold">{scheduledTime}</p>
              </div>
            </div>

            {/* Sócio Consciente Input - above price */}
            {professional.socio_consciente && !socioDiscountApplied && (
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 animate-in fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <span className="text-base">⚽</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Sócio Consciente</h3>
                    <p className="text-xs text-gray-500">Informe sua matrícula para 15% de desconto</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={socioMatricula}
                    onChange={(e) => setSocioMatricula(e.target.value)}
                    placeholder="Nº da matrícula"
                    maxLength={20}
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleApplySocioDiscount}
                    className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}

            {/* Sócio Consciente Applied */}
            {socioDiscountApplied && (
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Desconto aplicado!</p>
                    <p className="text-xs text-emerald-600">Matrícula: {socioMatricula}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveSocioDiscount}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium underline"
                >
                  Remover
                </button>
              </div>
            )}

            {/* Price Highlight */}
            <div 
              className="mt-1 p-4 rounded-2xl"
              style={{ backgroundColor: clubColor + '08' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" style={{ color: clubColor }} />
                  <span className="text-gray-700 font-medium">Valor</span>
                </div>
                <div className="text-right">
                  {isSocioConsciente && (
                    <span className="text-sm text-gray-400 line-through block">
                      R$ {basePrice.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  <span className="text-2xl font-bold" style={{ color: clubColor }}>
                    R$ {sessionPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
              {isSocioConsciente && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-semibold">⚽ Desconto Sócio Consciente (15%)</span>
                  <span className="text-sm font-bold text-emerald-600">
                    - R$ {discountAmount.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms Card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <BookingTermsDialog
            accepted={termsAccepted}
            onAcceptChange={setTermsAccepted}
            clubColor={clubColor}
          />
        </div>

        {/* Payment Methods */}
        {!paymentMethod && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div 
              className="px-5 py-4 flex items-center gap-3"
              style={{ backgroundColor: clubColor + '08' }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: clubColor + '15' }}
              >
                <CreditCard className="w-5 h-5" style={{ color: clubColor }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Forma de Pagamento</h2>
                <p className="text-sm text-gray-500">Escolha como deseja pagar</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Card Option */}
              {canProcessStripe && (
                <button
                  onClick={() => {
                    if (!termsAccepted) {
                      toast.error("Por favor, aceite os Termos e Política de Agendamento para continuar");
                      return;
                    }
                    setPaymentMethod("card");
                  }}
                  className="w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all hover:shadow-md group"
                  style={{ borderColor: clubColor + '30' }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: clubColor + '12' }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: clubColor }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Elo</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              {/* PIX Option */}
              {hasPixKey && (
                <button
                  onClick={() => {
                    if (!termsAccepted) {
                      toast.error("Por favor, aceite os Termos e Política de Agendamento para continuar");
                      return;
                    }
                    setPaymentMethod("pix");
                  }}
                  className="w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all hover:shadow-md group"
                  style={{ borderColor: clubColor + '30' }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#00A86820' }}
                  >
                    <QrCode className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">PIX</p>
                    <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* No payment methods */}
              {!canProcessStripe && !hasPixKey && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Pagamento Indisponível</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Este profissional ainda não configurou formas de recebimento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Payment Confirmation */}
        {paymentMethod === "card" && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-gray-900">Pagamento com Cartão</h2>
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Voltar
                </button>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl mb-5">
                <Shield className="w-5 h-5 text-emerald-600" />
                <p className="text-sm text-emerald-700">
                  Checkout seguro via Stripe
                </p>
              </div>

              <button
                onClick={handleCardPayment}
                disabled={processing}
                className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide transition-all shadow-lg disabled:opacity-70"
                style={{ 
                  backgroundColor: clubColor,
                  boxShadow: `0 10px 30px ${clubColor}40`
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
            </div>
          </div>
        )}

        {/* PIX Payment */}
        {paymentMethod === "pix" && pixCode && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-gray-900">Pague com PIX</h2>
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Voltar
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                {/* QR Code with decorative background */}
                <div 
                  className="p-6 rounded-2xl mb-5 relative"
                  style={{ backgroundColor: clubColor + '08' }}
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QRCodeSVG 
                      value={pixCode} 
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 text-center mb-5">
                  Escaneie o QR Code ou copie o código abaixo
                </p>

                {/* Copy Button */}
                <button
                  onClick={handleCopyPix}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all w-full justify-center mb-5
                    ${pixCopied ? 'bg-emerald-500 text-white' : ''}
                  `}
                  style={{ 
                    backgroundColor: pixCopied ? undefined : clubColor + '15',
                    color: pixCopied ? undefined : clubColor
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

                {!showReceiptUpload ? (
                  <button
                    onClick={handleShowReceiptUpload}
                    className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide transition-all shadow-lg"
                    style={{ 
                      backgroundColor: clubColor,
                      boxShadow: `0 10px 30px ${clubColor}40`
                    }}
                  >
                    Já Fiz o Pagamento
                  </button>
                ) : (
                  <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-gray-600 text-center font-medium">
                      Envie o comprovante de pagamento
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!receiptFile ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 transition-colors hover:border-current"
                        style={{ borderColor: clubColor + '50' }}
                      >
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: clubColor + '15' }}
                        >
                          <Upload className="w-6 h-6" style={{ color: clubColor }} />
                        </div>
                        <span className="text-gray-600 font-medium">Clique para enviar</span>
                        <span className="text-gray-400 text-sm">JPG, PNG ou PDF (máx. 5MB)</span>
                      </button>
                    ) : (
                      <div 
                        className="w-full p-4 rounded-2xl flex items-center justify-between"
                        style={{ backgroundColor: clubColor + '08' }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: clubColor + '15' }}
                          >
                            {receiptFile.type === 'application/pdf' ? (
                              <FileText className="w-5 h-5" style={{ color: clubColor }} />
                            ) : (
                              <Check className="w-5 h-5" style={{ color: clubColor }} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                              {receiptFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(receiptFile.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmAppointment}
                      disabled={!receiptFile || uploadingReceipt}
                      className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide transition-all shadow-lg disabled:opacity-50"
                      style={{ 
                        backgroundColor: clubColor,
                        boxShadow: `0 10px 30px ${clubColor}40`
                      }}
                    >
                      {uploadingReceipt ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        "Confirmar Agendamento"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionPayment;
