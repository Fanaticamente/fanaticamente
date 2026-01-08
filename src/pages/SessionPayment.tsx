import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Clock, User, Calendar, AlertCircle, Loader2, Copy, Check, QrCode, Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import BookingTermsDialog from "@/components/booking/BookingTermsDialog";

interface Professional {
  id: string;
  crp: string;
  degree: string | null;
  hourly_rate: number | null;
  user_id: string;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
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

type PaymentMethod = "card" | "pix" | null;

// Generate PIX EMV Code (BR Code / EMV)
// Spec reference: BACEN / EMVCo (Field 62 / TXID is commonly required by bank apps)
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

  // Merchant Account Information (26)
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", onlyAscii(pixKey));
  const merchantAccountInfo = formatField("26", gui + key);

  // Required core fields
  const payloadFormatIndicator = formatField("00", "01");
  const merchantCategoryCode = formatField("52", "0000");
  const transactionCurrency = formatField("53", "986"); // BRL

  const amountStr = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const transactionAmount = formatField("54", amountStr);

  const countryCode = formatField("58", "BR");
  const name = formatField("59", onlyAscii(merchantName).substring(0, 25));
  const city = formatField("60", onlyAscii(merchantCity).substring(0, 15) || "SAO PAULO");

  // Additional Data Field Template (62) with TXID (05)
  const safeTxid = onlyAscii(txid).replace(/\s+/g, "").substring(0, 25) || "***";
  const additionalData = formatField("62", formatField("05", safeTxid));

  // CRC16 placeholder
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

  // CRC16/CCITT-FALSE
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
      professional.hourly_rate || 150,
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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato inválido. Envie uma imagem ou PDF.");
        return;
      }
      // Validate file size (max 5MB)
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
      // Upload receipt to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-receipt.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      // Create appointment with receipt
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          status: 'pending',
          receipt_url: fileName, // Store the path, not public URL
        });

      if (appointmentError) throw appointmentError;

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
  const txid = `SESS${(id ?? "").replace(/-/g, "").slice(0, 8)}${scheduledDate.replace(/-/g, "").slice(2)}${scheduledTime.replace(":", "")}`;

  const pixCode = professional.pix_key && profile.full_name
    ? generatePixCode(professional.pix_key, sessionPrice, profile.full_name, txid)
    : null;

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

        {/* Booking Terms - Must accept before seeing payment options */}
        <BookingTermsDialog
          accepted={termsAccepted}
          onAcceptChange={setTermsAccepted}
          clubColor={clubColor}
        />

        {/* Payment Method Selection - Only show if terms accepted */}
        {termsAccepted && !paymentMethod && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
            <h2 className="font-bold text-lg mb-4" style={{ color: clubColor }}>Escolha a Forma de Pagamento</h2>
            
            <div className="space-y-3">
              {/* Card Option */}
              {canProcessStripe && (
                <button
                  onClick={() => setPaymentMethod("card")}
                  className="w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:border-current"
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
                </button>
              )}
              
              {/* PIX Option */}
              {hasPixKey && (
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className="w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:border-current"
                  style={{ borderColor: clubColor + "40" }}
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
              )}
            </div>

            {/* Warning if no payment methods available */}
            {!canProcessStripe && !hasPixKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Pagamento não disponível</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Este profissional ainda não configurou formas de recebimento.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card Payment Confirmation */}
        {paymentMethod === "card" && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: clubColor }}>Pagamento com Cartão</h2>
              <button
                onClick={() => setPaymentMethod(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Voltar
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Você será redirecionado para o checkout seguro do Stripe.
            </p>

            <button
              onClick={handleCardPayment}
              disabled={processing}
              className="w-full py-5 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg disabled:opacity-70"
              style={{ backgroundColor: clubColor, color: "#fff" }}
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
        )}

        {/* PIX Payment */}
        {paymentMethod === "pix" && pixCode && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: clubColor }}>Pague com PIX</h2>
              <button
                onClick={() => setPaymentMethod(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Voltar
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div 
                className="p-4 rounded-xl mb-4"
                style={{ backgroundColor: clubColor + "10" }}
              >
                <QRCodeSVG 
                  value={pixCode} 
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                Escaneie o QR Code ou copie o código PIX abaixo
              </p>

              {/* Copy Button */}
              <button
                onClick={handleCopyPix}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all mb-4"
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

              {!showReceiptUpload ? (
                <>
                  <p className="text-xs text-gray-400 text-center mb-6">
                    Após realizar o pagamento, clique no botão abaixo para enviar o comprovante
                  </p>

                  <button
                    onClick={handleShowReceiptUpload}
                    className="w-full py-5 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg"
                    style={{ backgroundColor: clubColor, color: "#fff" }}
                  >
                    Já Fiz o Pagamento
                  </button>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Envie o comprovante de pagamento (foto ou PDF)
                  </p>

                  {/* File Upload Area */}
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
                      className="w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors hover:border-current"
                      style={{ borderColor: clubColor + "60" }}
                    >
                      <Upload className="w-8 h-8" style={{ color: clubColor }} />
                      <span className="text-gray-600 text-sm">Clique para selecionar arquivo</span>
                      <span className="text-gray-400 text-xs">JPG, PNG ou PDF (máx. 5MB)</span>
                    </button>
                  ) : (
                    <div 
                      className="w-full p-4 rounded-xl flex items-center justify-between"
                      style={{ backgroundColor: clubColor + "10" }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: clubColor + "20" }}
                        >
                          {receiptFile.type === 'application/pdf' ? (
                            <FileText className="w-5 h-5" style={{ color: clubColor }} />
                          ) : (
                            <Check className="w-5 h-5" style={{ color: clubColor }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                            {receiptFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(receiptFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmAppointment}
                    disabled={!receiptFile || uploadingReceipt}
                    className="w-full py-5 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: clubColor, color: "#fff" }}
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
        )}
      </main>
    </div>
  );
};

export default SessionPayment;
