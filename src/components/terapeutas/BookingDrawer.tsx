import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Shirt, CheckCircle, Award, Clock, User, Calendar, Sparkles, CreditCard, AlertCircle, Loader2, Copy, Check, QrCode, Upload, FileText, X, Shield, Search, MapPin, Ticket, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFirstAndLastName } from "@/lib/utils";
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
  socioConsciente?: boolean;
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

interface CalendarSyncResult {
  ok?: boolean;
  needs_reconnect?: boolean;
}

interface ProfessionalPaymentInfo {
  stripe_account_status: string | null;
  pix_key: string | null;
}

interface BookingDrawerProps {
  therapist: TherapistData | null;
  clubColor: string;
  clubNickname?: string;
  clubName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asPage?: boolean;
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

const BookingDrawer = ({ therapist, clubColor, clubNickname, clubName, open, onOpenChange, asPage = false }: BookingDrawerProps) => {
  const { toast: toastHook } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile step state
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [gcalBlocks, setGcalBlocks] = useState<Array<{ start_time: string; end_time: string; is_all_day: boolean }>>([]);
  const [calendarNeedsReconnect, setCalendarNeedsReconnect] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  // (lockdown removido — slots individuais são filtrados por gcalBlocks)

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
  const [socioMatricula, setSocioMatricula] = useState("");
  const [socioDiscountApplied, setSocioDiscountApplied] = useState(false);
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
        // Trigger a fresh Google Calendar sync and WAIT for it to finish so
        // the blocks below reflect the latest busy times (force=true to bypass
        // server-side throttling whenever the booking flow is opened).
        try {
          const { data } = await supabase.functions.invoke('google-calendar-sync-now', {
            body: { professional_id: therapist.id, force: true },
          });
          setCalendarNeedsReconnect(!!(data as CalendarSyncResult | null)?.needs_reconnect);
        } catch (_) { /* best-effort */ }

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

        // Fetch Google Calendar busy blocks for this professional (next 60 days)
        const { data: blocksData } = await supabase
          .from('google_calendar_blocks')
          .select('start_time, end_time, is_all_day')
          .eq('professional_id', therapist.id);
        if (blocksData) setGcalBlocks(blocksData);

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
      setSocioMatricula("");
      setSocioDiscountApplied(false);
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

  // Realtime subscription for Google Calendar busy blocks — keeps slot
  // availability accurate when the professional adds/removes events on Google.
  useEffect(() => {
    if (!therapist || !open) return;
    const channel = supabase
      .channel(`gcal-blocks-drawer-${therapist.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'google_calendar_blocks',
          filter: `professional_id=eq.${therapist.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('google_calendar_blocks')
            .select('start_time, end_time, is_all_day')
            .eq('professional_id', therapist.id);
          if (data) setGcalBlocks(data);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [therapist, open]);

  if (!therapist) return null;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getAvailableTimesForDate = (date: Date) => {
    if (calendarNeedsReconnect) return [];

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

      // Exclude slots that overlap with a Google Calendar block (50 min session)
      const [sh, sm] = slot.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(sh, sm, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 50 * 60 * 1000);
      const conflict = gcalBlocks.some((b) => {
        const bs = new Date(b.start_time).getTime();
        const be = new Date(b.end_time).getTime();
        return bs < slotEnd.getTime() && be > slotStart.getTime();
      });
      if (conflict) return false;

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

  const basePrice = therapist.hourlyRate || 150;
  const isSocioConsciente = therapist.socioConsciente && socioDiscountApplied;
  const discountAmount = isSocioConsciente ? basePrice * 0.20 : 0;
  const sessionPrice = basePrice - discountAmount;
  const scheduledDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const canProcessStripe = paymentInfo?.stripe_account_status === "active";
  const hasPixKey = !!paymentInfo?.pix_key;

  // Gender inference (mirrors TherapistCard heuristic) for role + torcedor label
  const firstName = (therapist.name || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const female = firstName ? !new Set(["luca","costa","silva","andrea","sasha","elias","dias","jonas","tobias","matias","isaias","aoba"]).has(firstName) && (new Set(["lais","laís","ines","inês","beatriz","iris","íris","raquel","isabel"]).has(firstName) || /a$/.test(firstName)) : false;
  const roleLabel = (() => {
    const d = (therapist.degree || "").toLowerCase();
    if (d.includes("nutric")) return "Nutricionista";
    if (d.includes("fisio")) return "Fisioterapeuta";
    if (d.includes("psiqui")) return "Psiquiatra";
    return female ? "Psicóloga" : "Psicólogo";
  })();

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
    if (!user) return;

    setUploadingReceipt(true);

    try {
      const { data: createdApt, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          professional_id: therapist.id,
          scheduled_date: scheduledDateStr,
          scheduled_time: selectedTime,
          status: 'pending',
        })
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      // Push event to professional's Google Calendar (best-effort, awaited so it actually fires)
      if (createdApt?.id) {
        try {
          await Promise.race([
            supabase.functions.invoke('google-calendar-create-event', {
              body: { appointment_id: createdApt.id },
            }),
            new Promise((resolve) => setTimeout(resolve, 6000)),
          ]);
        } catch (err) {
          console.warn('gcal create-event failed', err);
        }
      }

      toast.success("Agendamento enviado! Aguarde a confirmação do profissional.");
      onOpenChange(false);
      navigate(`/pagamento/confirmacao/${therapist.id}?date=${scheduledDateStr}&time=${selectedTime}`);
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Erro ao enviar agendamento. Tente novamente.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const headerTitle = step === "profile" ? "Perfil profissional" : "Confirmar agendamento";
  const handleHeaderBack = () => {
    if (step === "payment") setStep("profile");
    else onOpenChange(false);
  };

  const bodyContent = (
    <div className={asPage ? "pb-24" : "overflow-y-auto max-h-[calc(90vh-64px)] pb-8"}>
          {step === "profile" ? (
            <div className="p-4 space-y-4">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 font-sans">
                <div className="flex items-start gap-4">
                  <div
                    className="relative flex-shrink-0 w-[120px] h-[140px] rounded-2xl overflow-hidden"
                    style={{ boxShadow: `0 0 0 2px ${clubColor}22` }}
                  >
                    {therapist.imageUrl ? (
                      <img
                        src={therapist.imageUrl}
                        alt={therapist.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-8 h-8" style={{ color: clubColor }} />
                      </div>
                    )}
                    {therapist.verified && (
                      <div
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: clubColor }}
                        aria-label="Verificado"
                      >
                        <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2
                        className="font-bold text-gray-900 text-[20px] leading-tight"
                        style={{ textTransform: "capitalize" }}
                      >
                        {getFirstAndLastName(therapist.name).toLowerCase()}
                      </h2>
                      {therapist.verified && (
                        <BadgeCheck className="w-5 h-5" style={{ color: clubColor }} fill={clubColor} stroke="#fff" />
                      )}
                    </div>
                    <div className="mt-1.5">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: clubColor + '15', color: clubColor }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5">CRP: {therapist.crp}</p>
                    <div className="flex items-stretch gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 flex-shrink-0" style={{ color: clubColor }} />
                        <div className="leading-tight">
                          <div className="text-[12px] font-bold text-gray-800 whitespace-nowrap">{therapist.experience} {therapist.experience === 1 ? 'ano' : 'anos'}</div>
                          <div className="text-[9px] text-gray-500 whitespace-nowrap">de experiência</div>
                        </div>
                      </div>
                      <div className="w-px bg-gray-200 flex-shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <Shirt className="w-4 h-4 flex-shrink-0" style={{ color: clubColor }} strokeWidth={2} />
                        <div className="leading-tight">
                          <div className="text-[12px] font-bold text-gray-800 whitespace-nowrap">{female ? "Torcedora" : "Torcedor"}</div>
                          {clubName && <div className="text-[9px] text-gray-500 whitespace-nowrap">{clubName}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session value */}
                <div
                  className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: clubColor + '10' }}
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" style={{ color: clubColor }} strokeWidth={2.2} />
                    <span className="text-sm font-medium" style={{ color: clubColor }}>Valor da sessão</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: clubColor }}>
                    R$ {basePrice.toFixed(2).replace('.', ',')}
                  </span>
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
                              className="w-full mt-4 py-3 rounded-xl font-bold text-white tracking-wide shadow-lg animate-in fade-in slide-in-from-bottom-2 normal-case"
                              style={{
                                backgroundColor: clubColor,
                                boxShadow: `0 8px 24px ${clubColor}40`
                              }}
                            >
                              Agendar sessão
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
            </div>
          ) : (
            /* Payment Step */
            <div className="p-4 space-y-4">
              {/* Session Summary - Ticket Style with transparent cutouts */}
              <div 
                className="relative bg-white rounded-2xl shadow-sm"
                style={{
                  maskImage: 'radial-gradient(circle at 0% 50%, transparent 12px, black 12px), radial-gradient(circle at 100% 50%, transparent 12px, black 12px)',
                  WebkitMaskImage: 'radial-gradient(circle at 0% 50%, transparent 12px, black 12px), radial-gradient(circle at 100% 50%, transparent 12px, black 12px)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in'
                }}
              >
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden border-2"
                    style={{ borderColor: clubColor + '40' }}
                  >
                    {therapist.imageUrl ? (
                      <img src={therapist.imageUrl} alt={therapist.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-6 h-6" style={{ color: clubColor }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans font-bold text-gray-800 text-xl">{getFirstAndLastName(therapist.name)}</h3>
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
                  {/* Sócio Consciente Input */}
                   {therapist.socioConsciente && !socioDiscountApplied && (
                    <div 
                      className="p-3 rounded-xl border"
                      style={{ borderColor: clubColor + "30", backgroundColor: clubColor + "08" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5" style={{ color: clubColor }} />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Sócio Consciente{clubNickname ? ` ${clubNickname}` : ''}</p>
                          <p className="text-[10px] text-gray-500">Informe sua matrícula</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={socioMatricula}
                          onChange={(e) => setSocioMatricula(e.target.value)}
                          placeholder="Nº da matrícula"
                          maxLength={20}
                          className="flex-1 px-3 py-2 bg-white border rounded-lg text-gray-800 text-sm focus:outline-none transition-colors"
                          style={{ borderColor: clubColor + "30" }}
                        />
                        <button
                          onClick={() => {
                            if (!socioMatricula.trim() || socioMatricula.trim().length < 3) {
                              toast.error("Informe uma matrícula válida");
                              return;
                            }
                            setSocioDiscountApplied(true);
                            // Toast removed per design request
                          }}
                          className="px-4 py-2 text-white rounded-lg font-semibold text-sm transition-colors"
                          style={{ backgroundColor: clubColor }}
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}

                  {socioDiscountApplied && (
                    <div 
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{ borderColor: clubColor + "30", backgroundColor: clubColor + "10" }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: clubColor }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: clubColor }}>Parceria aplicada</p>
                          <p className="text-[10px]" style={{ color: clubColor + "99" }}>Matrícula: {socioMatricula}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSocioDiscountApplied(false); setSocioMatricula(""); }}
                        className="text-[10px] font-medium underline"
                        style={{ color: clubColor }}
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  <div
                    className="mt-2 p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: clubColor + '10' }}
                  >
                    <span className="text-gray-600 font-medium text-sm">Valor</span>
                    <div className="text-right">
                      <span className="text-xl font-bold" style={{ color: clubColor }}>
                        R$ {sessionPrice.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
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

              {/* Confirm Appointment (no payment required) */}
              <button
                onClick={() => {
                  if (!termsAccepted) {
                    toast.error("Aceite os termos para continuar");
                    return;
                  }
                  handleConfirmAppointment();
                }}
                disabled={uploadingReceipt}
                className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-wide shadow-lg disabled:opacity-70"
                style={{ backgroundColor: clubColor }}
              >
                {uploadingReceipt ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirmando...
                  </span>
                ) : (
                  "Confirmar Agendamento"
                )}
              </button>
            </div>
          )}
        </div>
  );

  if (asPage) {
    if (!open) return null;
    return (
      <div className="min-h-screen bg-white font-sans">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white flex items-center justify-between px-3 py-2 pt-[calc(env(safe-area-inset-top)+8px)]">
          <button
            aria-label="Voltar"
            onClick={handleHeaderBack}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 max-w-[calc(100%-120px)] font-sans font-semibold text-base text-slate-900 truncate normal-case">
            {headerTitle}
          </h1>
          <button
            aria-label="Buscar"
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
          >
            <Search className="w-5 h-5" />
          </button>
        </header>
        <div className="pt-[calc(env(safe-area-inset-top)+64px)] bg-white min-h-screen">
          {bodyContent}
        </div>
      </div>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl shadow-2xl bg-white duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3" style={{ backgroundColor: clubColor }}>
            <button
              onClick={handleHeaderBack}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <DialogTitle className="text-white font-bold text-xl font-sans normal-case">
              {headerTitle}
            </DialogTitle>
          </div>
          {bodyContent}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default BookingDrawer;
