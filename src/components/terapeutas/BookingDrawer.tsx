import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle, Award, Clock, User, Calendar, Sparkles, CreditCard, AlertCircle, Loader2, Copy, Check, QrCode, Upload, FileText, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import BookingTermsDialog from "@/components/booking/BookingTermsDialog";
import { useNavigate } from "react-router-dom";

interface TherapistData {
  id: string;
  name: string;
  crp: string;
  degree: string;
  experience: number;
  location: string;
  specialties: string[];
  verified: boolean;
  imageUrl?: string;
  hourlyRate?: number;
  bio?: string;
}

interface WeeklyAvailability {
  day_of_week: number;
  time_slots: string[];
}

interface Appointment {
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

interface ProfessionalPaymentInfo {
  stripe_account_status: string | null;
  pix_key: string | null;
}

interface BookingDrawerProps {
  therapist: TherapistData | null;
  clubColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BookingStep = "profile" | "payment";
type PaymentMethod = "card" | "pix" | null;

// Generate PIX EMV Code
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

const BookingDrawer = ({ therapist, clubColor, open, onOpenChange }: BookingDrawerProps) => {
  const { toast: toastHook } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile step state
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Payment step state
  const [step, setStep] = useState<BookingStep>("profile");
  const [paymentInfo, setPaymentInfo] = useState<ProfessionalPaymentInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch availability when therapist changes
  useEffect(() => {
    if (!therapist || !open) return;

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const { data: availabilityData } = await supabase
          .from('professional_weekly_availability')
          .select('day_of_week, time_slots')
          .eq('professional_id', therapist.id)
          .order('day_of_week', { ascending: true });

        if (availabilityData) {
          setWeeklyAvailability(availabilityData);
        }

        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('scheduled_date, scheduled_time, status')
          .eq('professional_id', therapist.id)
          .in('status', ['pending', 'confirmed', 'paid']);

        if (appointmentsData) {
          setBookedAppointments(appointmentsData);
        }

        // Fetch payment info
        const { data: paymentData } = await supabase
          .from("professionals")
          .select("stripe_account_status, pix_key")
          .eq("id", therapist.id)
          .single();

        if (paymentData) {
          setPaymentInfo(paymentData);
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [therapist, open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setStep("profile");
      setSelectedDate(null);
      setSelectedTime(null);
      setPaymentMethod(null);
      setTermsAccepted(false);
      setShowReceiptUpload(false);
      setReceiptFile(null);
      setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  }, [open]);

  // Realtime subscription
  useEffect(() => {
    if (!therapist || !open) return;

    const channel = supabase
      .channel(`appointments-drawer-${therapist.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `professional_id=eq.${therapist.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment & { professional_id: string };
            if (['pending', 'confirmed', 'paid'].includes(newAppointment.status)) {
              setBookedAppointments(prev => [...prev, {
                scheduled_date: newAppointment.scheduled_date,
                scheduled_time: newAppointment.scheduled_time,
                status: newAppointment.status
              }]);

              if (selectedDate && selectedTime) {
                const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
                if (newAppointment.scheduled_date === selectedDateStr &&
                    newAppointment.scheduled_time === selectedTime) {
                  setSelectedTime(null);
                  toastHook({
                    title: "Horário indisponível",
                    description: "Este horário acabou de ser reservado.",
                    variant: "destructive",
                  });
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [therapist, open, selectedDate, selectedTime, toastHook]);

  if (!therapist) return null;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getAvailableTimesForDate = (date: Date) => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const dateStr = format(date, "yyyy-MM-dd");

    if (dateStr < todayStr) return [];

    const dayOfWeek = date.getDay();
    const availability = weeklyAvailability.find(a => a.day_of_week === dayOfWeek);
    const allSlots = availability?.time_slots || [];

    const bookedTimes = bookedAppointments
      .filter(apt => apt.scheduled_date === dateStr)
      .map(apt => apt.scheduled_time);

    return allSlots.filter(slot => {
      if (bookedTimes.includes(slot)) return false;

      if (dateStr === todayStr) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        if (slotTime < oneHourFromNow) return false;
      }

      return true;
    });
  };

  const getDayAbbreviation = (date: Date): string => {
    const dayOfWeek = date.getDay();
    const abbreviations = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return abbreviations[dayOfWeek];
  };

  const handleSchedule = () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (therapist && currentUserId) {
      // Check if trying to book with self - need to get user_id
      // For now, proceed to payment step
    }

    if (selectedDate && selectedTime) {
      setStep("payment");
    }
  };

  const sessionPrice = therapist.hourlyRate || 150;
  const scheduledDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const canProcessStripe = paymentInfo?.stripe_account_status === "active";
  const hasPixKey = !!paymentInfo?.pix_key;

  const txid = `SESS${therapist.id.replace(/-/g, "").slice(0, 8)}${scheduledDateStr.replace(/-/g, "").slice(2)}${(selectedTime || "").replace(":", "")}`;
  const pixCode = paymentInfo?.pix_key && therapist.name
    ? generatePixCode(paymentInfo.pix_key, sessionPrice, therapist.name, txid)
    : null;

  const handleCardPayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar");
      return;
    }

    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: {
          professionalId: therapist.id,
          scheduledDate: scheduledDateStr,
          scheduledTime: selectedTime,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
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
    if (!user || !receiptFile) return;

    setUploadingReceipt(true);

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-receipt.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: therapist.id,
          scheduled_date: scheduledDateStr,
          scheduled_time: selectedTime,
          status: 'pending',
          receipt_url: fileName,
        });

      if (appointmentError) throw appointmentError;

      toast.success("Agendamento enviado! O profissional irá verificar o comprovante.");
      onOpenChange(false);
      navigate(`/pagamento/confirmacao/${therapist.id}?date=${scheduledDateStr}&time=${selectedTime}`);
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Erro ao enviar agendamento. Tente novamente.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
          style={{ backgroundColor: clubColor }}
        >
          <button
            onClick={() => step === "payment" ? setStep("profile") : onOpenChange(false)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <DialogTitle className="text-white font-bold text-lg">
            {step === "profile" ? "Agendar Sessão" : "Confirmar Pagamento"}
          </DialogTitle>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-64px)] pb-8">
          {step === "profile" ? (
            <div className="p-4 space-y-4">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden border-2"
                    style={{ borderColor: clubColor + '40' }}
                  >
                    {therapist.imageUrl ? (
                      <img
                        src={therapist.imageUrl}
                        alt={therapist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-8 h-8" style={{ color: clubColor }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 text-lg">{therapist.name}</h2>
                      {therapist.verified && (
                        <CheckCircle className="w-5 h-5" style={{ color: clubColor }} />
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{therapist.degree}</p>
                    <p className="text-gray-400 text-xs">CRP: {therapist.crp}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: clubColor }} />
                        {therapist.experience} anos
                      </span>
                      {therapist.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" style={{ color: clubColor }} />
                          {therapist.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {therapist.hourlyRate && (
                  <div
                    className="mt-4 p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: clubColor + '10' }}
                  >
                    <span className="text-gray-600 font-medium">Valor da sessão</span>
                    <span className="text-xl font-bold" style={{ color: clubColor }}>
                      R$ {therapist.hourlyRate.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: clubColor + '08' }}
                >
                  <Calendar className="w-5 h-5" style={{ color: clubColor }} />
                  <span className="font-semibold text-gray-900">Escolha a data e horário</span>
                </div>

                <div className="p-4">
                  {loadingAvailability ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: clubColor }} />
                    </div>
                  ) : (
                    <>
                      {/* Week Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-gray-800 font-medium text-sm capitalize">
                          {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
                        </span>
                        <button
                          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Week Days */}
                      <div className="grid grid-cols-7 gap-1.5 mb-4">
                        {weekDays.map((day) => {
                          const times = getAvailableTimesForDate(day);
                          const isAvailable = times.length > 0;
                          const isSelected = selectedDate && isSameDay(day, selectedDate);

                          return (
                            <button
                              key={day.toString()}
                              onClick={() => isAvailable && setSelectedDate(day)}
                              disabled={!isAvailable}
                              className={`
                                flex flex-col items-center py-2.5 rounded-xl transition-all text-center
                                ${isSelected ? 'text-white shadow-md' : isAvailable ? 'bg-gray-50 text-gray-700' : 'bg-gray-50 text-gray-300'}
                              `}
                              style={{
                                backgroundColor: isSelected ? clubColor : undefined,
                              }}
                            >
                              <span className="text-[9px] uppercase font-medium">
                                {getDayAbbreviation(day)}
                              </span>
                              <span className="text-base font-bold">
                                {format(day, "d")}
                              </span>
                              {isAvailable && !isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-gray-600 text-sm mb-2 font-medium">
                            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {getAvailableTimesForDate(selectedDate).map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`
                                  py-2.5 rounded-xl text-sm font-semibold transition-all
                                  ${selectedTime === time ? 'text-white shadow-md' : 'bg-gray-50 text-gray-700'}
                                `}
                                style={{
                                  backgroundColor: selectedTime === time ? clubColor : undefined,
                                }}
                              >
                                {time}
                              </button>
                            ))}
                          </div>

                          {/* Schedule Button - appears after selecting time */}
                          {selectedTime && (
                            <button
                              onClick={handleSchedule}
                              className="w-full mt-4 py-3 rounded-xl font-bold text-white uppercase tracking-wide shadow-lg animate-in fade-in slide-in-from-bottom-2"
                              style={{
                                backgroundColor: clubColor,
                                boxShadow: `0 8px 24px ${clubColor}40`
                              }}
                            >
                              Agendar Sessão
                            </button>
                          )}
                        </div>
                      )}

                      {selectedDate && getAvailableTimesForDate(selectedDate).length === 0 && (
                        <div className="text-center py-6">
                          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Sem horários disponíveis</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {therapist.bio && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" style={{ color: clubColor }} />
                    <span className="font-semibold text-gray-900 text-sm">Sobre</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{therapist.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {therapist.specialties.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" style={{ color: clubColor }} />
                    <span className="font-semibold text-gray-900 text-sm">Especialidades</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {therapist.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: clubColor + '15', color: clubColor }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Payment Step */
            <div className="p-4 space-y-4">
              {/* Session Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden border-2"
                    style={{ borderColor: clubColor + '40' }}
                  >
                    {therapist.imageUrl ? (
                      <img src={therapist.imageUrl} alt={therapist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-6 h-6" style={{ color: clubColor }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{therapist.name}</h3>
                    <p className="text-gray-500 text-xs">{therapist.degree} • CRP: {therapist.crp}</p>
                  </div>
                </div>

                <div className="px-4">
                  <div className="border-t border-dashed border-gray-200" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: clubColor }} />
                    <span className="text-gray-700 text-sm">
                      {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" style={{ color: clubColor }} />
                    <span className="text-gray-700 text-sm">{selectedTime}</span>
                  </div>
                  <div
                    className="mt-2 p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: clubColor + '10' }}
                  >
                    <span className="text-gray-600 font-medium text-sm">Valor</span>
                    <span className="text-xl font-bold" style={{ color: clubColor }}>
                      R$ {sessionPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <BookingTermsDialog
                  accepted={termsAccepted}
                  onAcceptChange={setTermsAccepted}
                  clubColor={clubColor}
                />
              </div>

              {/* Payment Methods */}
              {!paymentMethod && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: clubColor + '08' }}
                  >
                    <CreditCard className="w-5 h-5" style={{ color: clubColor }} />
                    <span className="font-semibold text-gray-900">Forma de Pagamento</span>
                  </div>

                  <div className="p-4 space-y-2">
                    {canProcessStripe && (
                      <button
                        onClick={() => {
                          if (!termsAccepted) {
                            toast.error("Aceite os termos para continuar");
                            return;
                          }
                          setPaymentMethod("card");
                        }}
                        className="w-full p-3 rounded-xl border-2 flex items-center gap-3"
                        style={{ borderColor: clubColor + '30' }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: clubColor + '15' }}
                        >
                          <CreditCard className="w-5 h-5" style={{ color: clubColor }} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 text-sm">Cartão de Crédito</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Elo</p>
                        </div>
                      </button>
                    )}

                    {hasPixKey && (
                      <button
                        onClick={() => {
                          if (!termsAccepted) {
                            toast.error("Aceite os termos para continuar");
                            return;
                          }
                          setPaymentMethod("pix");
                        }}
                        className="w-full p-3 rounded-xl border-2 flex items-center gap-3"
                        style={{ borderColor: clubColor + '30' }}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                          <QrCode className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 text-sm">PIX</p>
                          <p className="text-xs text-gray-500">Pagamento instantâneo</p>
                        </div>
                      </button>
                    )}

                    {!canProcessStripe && !hasPixKey && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800 text-sm">Pagamento Indisponível</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Este profissional ainda não configurou formas de recebimento.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Payment */}
              {paymentMethod === "card" && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Pagamento com Cartão</h3>
                    <button onClick={() => setPaymentMethod(null)} className="text-sm text-gray-500">
                      Voltar
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl mb-4">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700">Checkout seguro via Stripe</p>
                  </div>

                  <button
                    onClick={handleCardPayment}
                    disabled={processing}
                    className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide shadow-lg disabled:opacity-70"
                    style={{ backgroundColor: clubColor }}
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
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Pague com PIX</h3>
                    <button onClick={() => setPaymentMethod(null)} className="text-sm text-gray-500">
                      Voltar
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className="p-4 rounded-xl mb-4"
                      style={{ backgroundColor: clubColor + '08' }}
                    >
                      <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG value={pixCode} size={160} level="M" />
                      </div>
                    </div>

                    <button
                      onClick={handleCopyPix}
                      className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-full justify-center mb-4
                        ${pixCopied ? 'bg-emerald-500 text-white' : ''}
                      `}
                      style={{
                        backgroundColor: pixCopied ? undefined : clubColor + '15',
                        color: pixCopied ? undefined : clubColor
                      }}
                    >
                      {pixCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Código PIX
                        </>
                      )}
                    </button>

                    {!showReceiptUpload ? (
                      <button
                        onClick={() => setShowReceiptUpload(true)}
                        className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide shadow-lg"
                        style={{ backgroundColor: clubColor }}
                      >
                        Já Fiz o Pagamento
                      </button>
                    ) : (
                      <div className="w-full space-y-3">
                        <p className="text-sm text-gray-600 text-center">
                          Envie o comprovante
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
                            className="w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center gap-2"
                            style={{ borderColor: clubColor + '50' }}
                          >
                            <Upload className="w-6 h-6" style={{ color: clubColor }} />
                            <span className="text-gray-600 text-sm">Clique para enviar</span>
                          </button>
                        ) : (
                          <div
                            className="w-full p-3 rounded-xl flex items-center justify-between"
                            style={{ backgroundColor: clubColor + '10' }}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5" style={{ color: clubColor }} />
                              <span className="text-sm text-gray-800 truncate max-w-[180px]">
                                {receiptFile.name}
                              </span>
                            </div>
                            <button onClick={handleRemoveFile} className="p-1">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={handleConfirmAppointment}
                          disabled={!receiptFile || uploadingReceipt}
                          className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide shadow-lg disabled:opacity-50"
                          style={{ backgroundColor: clubColor }}
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDrawer;
